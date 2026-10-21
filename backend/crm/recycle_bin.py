"""
Recycle bin API — list / restore / permanently purge soft-deleted records.
Admin-only. Tracks who deleted via deleted_by + auditlog.
"""
from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CallLog, Customer, Order, Phone, Product

RECYCLE_MODELS = {
    'customer': Customer,
    'order': Order,
    'product': Product,
    'calllog': CallLog,
    'phone': Phone,
}


def _actor_name(user):
    if not user:
        return None
    full = f"{getattr(user, 'first_name', '') or ''} {getattr(user, 'last_name', '') or ''}".strip()
    return full or user.username


def _user_by_pk(pk):
    if pk in (None, '', 'None', 'null'):
        return None
    try:
        from django.contrib.auth import get_user_model
        return get_user_model().objects.filter(pk=int(pk)).first()
    except (TypeError, ValueError):
        return None


def _changes_dict(entry):
    if hasattr(entry, 'changes_dict'):
        try:
            return entry.changes_dict or {}
        except Exception:
            pass
    raw = entry.changes
    return raw if isinstance(raw, dict) else {}


def _resolve_actor(entry):
    """Prefer LogEntry.actor; fall back to deleted_by in change diff (pre-JWT audits)."""
    if entry.actor_id:
        return {
            'id': entry.actor_id,
            'name': _actor_name(entry.actor),
            'username': getattr(entry.actor, 'username', None),
        }

    changes = _changes_dict(entry)
    deleted_by = changes.get('deleted_by')
    if isinstance(deleted_by, (list, tuple)) and len(deleted_by) >= 2:
        # Prefer the non-empty side (delete sets user; restore clears it)
        for candidate in (deleted_by[1], deleted_by[0]):
            user = _user_by_pk(candidate)
            if user:
                return {
                    'id': user.pk,
                    'name': _actor_name(user),
                    'username': user.username,
                }

    return {'id': None, 'name': None, 'username': None}


def _infer_action_label(entry, changes):
    action_map = {0: 'create', 1: 'update', 2: 'delete', 3: 'access'}
    base = action_map.get(entry.action, str(entry.action))
    if base != 'update' or not changes:
        return base
    deleted_at = changes.get('deleted_at')
    if isinstance(deleted_at, (list, tuple)) and len(deleted_at) >= 2:
        old, new = deleted_at[0], deleted_at[1]
        if str(old) in ('None', 'null', '') and str(new) not in ('None', 'null', ''):
            return 'soft_delete'
        if str(old) not in ('None', 'null', '') and str(new) in ('None', 'null', ''):
            return 'restore'
    return base


def _normalize_changes(changes):
    """Turn auditlog [old, new] map into a list suitable for the UI."""
    rows = []
    if not isinstance(changes, dict):
        return rows
    for field, diff in changes.items():
        if isinstance(diff, (list, tuple)) and len(diff) >= 2:
            rows.append({'field': field, 'from': diff[0], 'to': diff[1]})
        else:
            rows.append({'field': field, 'from': None, 'to': diff})
    return rows


def _display_label(model_key, obj):
    if model_key == 'customer':
        snap = obj.unique_snapshot or {}
        name = f"{obj.name or ''} {obj.surname or ''}".strip() or 'Unnamed'
        phone = snap.get('phone') or obj.phone
        return f"{name} ({phone})"
    if model_key == 'order':
        snap = obj.unique_snapshot or {}
        oid = snap.get('order_id') or obj.order_id
        return f"{oid} — ₹{obj.total_amount}"
    if model_key == 'product':
        snap = obj.unique_snapshot or {}
        return f"{obj.title or 'Product'} ({snap.get('sku') or obj.sku or snap.get('pid') or obj.pid or obj.id})"
    if model_key == 'calllog':
        snap = obj.unique_snapshot or {}
        return snap.get('call_id') or obj.call_id or f"Call #{obj.id}"
    if model_key == 'phone':
        snap = obj.unique_snapshot or {}
        return snap.get('phone') or obj.phone
    return str(obj)


def _serialize_deleted(model_key, obj):
    return {
        'id': obj.id,
        'model': model_key,
        'label': _display_label(model_key, obj),
        'deleted_at': obj.deleted_at.isoformat() if obj.deleted_at else None,
        'deleted_by': _actor_name(obj.deleted_by),
        'deleted_by_id': obj.deleted_by_id,
        'unique_snapshot': obj.unique_snapshot,
    }


class RecycleBinListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'Admin':
            return Response({'error': 'Only admins can view the recycle bin'}, status=status.HTTP_403_FORBIDDEN)

        model_filter = (request.query_params.get('model') or '').strip().lower()
        items = []

        for key, model in RECYCLE_MODELS.items():
            if model_filter and model_filter != key:
                continue
            qs = model.deleted_objects.select_related('deleted_by').order_by('-deleted_at')[:200]
            for obj in qs:
                items.append(_serialize_deleted(key, obj))

        items.sort(key=lambda x: x['deleted_at'] or '', reverse=True)
        return Response({
            'count': len(items),
            'results': items,
            'models': list(RECYCLE_MODELS.keys()),
        })


class RecycleBinRestoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'Admin':
            return Response({'error': 'Only admins can restore'}, status=status.HTTP_403_FORBIDDEN)

        model_key = (request.data.get('model') or '').strip().lower()
        object_id = request.data.get('id')
        model = RECYCLE_MODELS.get(model_key)
        if not model or not object_id:
            return Response({'error': 'model and id are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            obj = model.deleted_objects.get(pk=object_id)
        except model.DoesNotExist:
            return Response({'error': 'Deleted record not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            obj.restore(user=request.user)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_409_CONFLICT)

        return Response({'success': True, 'message': f'{model_key} #{object_id} restored'})


class RecycleBinPurgeView(APIView):
    """Permanently delete (hard delete) from recycle bin — irreversible."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'Admin':
            return Response({'error': 'Only admins can purge'}, status=status.HTTP_403_FORBIDDEN)

        model_key = (request.data.get('model') or '').strip().lower()
        object_id = request.data.get('id')
        model = RECYCLE_MODELS.get(model_key)
        if not model or not object_id:
            return Response({'error': 'model and id are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            obj = model.deleted_objects.get(pk=object_id)
        except model.DoesNotExist:
            return Response({'error': 'Deleted record not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            obj.hard_delete()
        except Exception as e:
            return Response(
                {'error': f'Cannot permanently delete: {e}'},
                status=status.HTTP_409_CONFLICT,
            )

        return Response({'success': True, 'message': f'{model_key} #{object_id} permanently deleted'})


class AuditLogListView(APIView):
    """Recent create/update/delete events from django-auditlog (who/what/when + field diffs)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'Admin':
            return Response({'error': 'Only admins can view audit logs'}, status=status.HTTP_403_FORBIDDEN)

        from auditlog.models import LogEntry

        qs = LogEntry.objects.select_related('actor', 'content_type').order_by('-timestamp')[:200]
        results = []
        for entry in qs:
            changes = _changes_dict(entry)
            actor = _resolve_actor(entry)
            results.append({
                'id': entry.id,
                'action': _infer_action_label(entry, changes),
                'timestamp': entry.timestamp.isoformat() if entry.timestamp else None,
                'actor': actor['name'],
                'actor_id': actor['id'],
                'actor_username': actor['username'],
                'model': (
                    f"{entry.content_type.app_label}.{entry.content_type.model}"
                    if entry.content_type else None
                ),
                'object_pk': entry.object_pk,
                'object_repr': entry.object_repr,
                'remote_addr': getattr(entry, 'remote_addr', None),
                'changes': changes,
                'change_rows': _normalize_changes(changes),
            })
        return Response({'count': len(results), 'results': results})
