from django.apps import AppConfig


class CrmConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'crm'

    def ready(self):
        from auditlog.registry import auditlog
        from .models import CallLog, Customer, Order, Phone, Product

        for model in (Customer, Order, Product, CallLog, Phone):
            try:
                auditlog.register(model)
            except Exception:
                # Already registered on autoreload
                pass
