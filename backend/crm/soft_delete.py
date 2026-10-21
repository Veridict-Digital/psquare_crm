"""
Soft-delete (recycle bin) support for critical CRM models.

Records are hidden via deleted_at instead of being removed from the DB.
Unique fields are temporarily renamed so the same phone/SKU/etc. can be reused.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self, user=None):
        """Soft-delete every object in the queryset."""
        count = 0
        for obj in self:
            obj.delete(user=user)
            count += 1
        return count, {self.model._meta.label: count}

    def hard_delete(self):
        return super().delete()

    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.filter(deleted_at__isnull=False)

    def restore(self, user=None):
        restored = 0
        for obj in self:
            obj.restore(user=user)
            restored += 1
        return restored


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class AllObjectsManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


class DeletedObjectsManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).dead()


class SoftDeleteModel(models.Model):
    """
    Abstract base: soft delete + who deleted + unique-field snapshot for restore.
    Subclasses may set soft_unique_fields = ['phone', ...]
    """

    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
    )
    unique_snapshot = models.JSONField(null=True, blank=True, default=None)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()
    deleted_objects = DeletedObjectsManager()

    # Override in subclasses for unique CharFields that must be freed on delete
    soft_unique_fields = []

    class Meta:
        abstract = True

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def _scrub_unique_fields(self):
        snapshot = {}
        for field_name in self.soft_unique_fields:
            value = getattr(self, field_name, None)
            if value is None or value == '':
                continue
            snapshot[field_name] = value
            # Keep under typical max_length (15–50) where possible
            marker = f"__del{self.pk}"
            max_len = self._meta.get_field(field_name).max_length or 255
            base = str(value)
            if len(base) + len(marker) > max_len:
                base = base[: max_len - len(marker)]
            setattr(self, field_name, f"{base}{marker}")
        self.unique_snapshot = snapshot or None

    def _restore_unique_fields(self):
        snapshot = self.unique_snapshot or {}
        for field_name, original in snapshot.items():
            conflict = (
                self.__class__.objects.filter(**{field_name: original})
                .exclude(pk=self.pk)
                .exists()
            )
            if conflict:
                raise ValueError(
                    f"Cannot restore: {field_name}='{original}' is already used by an active record."
                )
            setattr(self, field_name, original)
        self.unique_snapshot = None

    def delete(self, using=None, keep_parents=False, user=None, hard=False):
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)

        if self.deleted_at:
            return (0, {})

        def _do_soft_delete():
            self._scrub_unique_fields()
            self.deleted_at = timezone.now()
            if user is not None and getattr(user, 'is_authenticated', False):
                self.deleted_by = user
            # Bypass subclass save() hooks (e.g. Customer phone auto-create)
            update_fields = ['deleted_at', 'deleted_by', 'unique_snapshot', *self.soft_unique_fields]
            models.Model.save(self, update_fields=list(dict.fromkeys(update_fields)))
            return (1, {self._meta.label: 1})

        if user is not None and getattr(user, 'is_authenticated', False):
            from auditlog.context import set_actor
            with set_actor(actor=user):
                return _do_soft_delete()
        return _do_soft_delete()

    def restore(self, user=None):
        if not self.deleted_at:
            return

        def _do_restore():
            self._restore_unique_fields()
            self.deleted_at = None
            self.deleted_by = None
            update_fields = ['deleted_at', 'deleted_by', 'unique_snapshot', *self.soft_unique_fields]
            models.Model.save(self, update_fields=list(dict.fromkeys(update_fields)))

        if user is not None and getattr(user, 'is_authenticated', False):
            from auditlog.context import set_actor
            with set_actor(actor=user):
                return _do_restore()
        return _do_restore()

    def hard_delete(self, using=None, keep_parents=False):
        return super().delete(using=using, keep_parents=keep_parents)
