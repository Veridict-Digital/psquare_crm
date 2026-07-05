from django.core.management.base import BaseCommand
from crm.models import Role, RoleFeaturePermission

class Command(BaseCommand):
    help = 'Seeds default roles and feature permissions into the database'

    def handle(self, *args, **options):
        # 1. Create Default Roles
        admin_role, _ = Role.objects.get_or_create(
            name='Admin',
            defaults={'description': 'System Administrator with full access to all features'}
        )
        employee_role, _ = Role.objects.get_or_create(
            name='Employee',
            defaults={'description': 'Standard employee responsible for lead updates and appointments'}
        )
        telecaller_role, _ = Role.objects.get_or_create(
            name='Telecaller',
            defaults={'description': 'Telecalling agent responsible for dialing and lead updates'}
        )

        # All defined feature keys
        all_features = [
            # Dashboard
            'view_dashboard',
            # Customers
            'view_customers', 'create_customer', 'edit_customer', 'delete_customer', 'reassign_customers', 'manage_appointments',
            # Call Logging
            'make_calls', 'view_call_history',
            # Orders
            'view_orders', 'create_order', 'edit_order', 'delete_order', 'update_payment', 'export_orders',
            # Products & Combos
            'view_products', 'manage_products', 'manage_combos',
            # Administration
            'manage_users', 'manage_roles'
        ]

        # Features for Telecaller
        telecaller_features = [
            'view_dashboard',
            'view_customers', 'create_customer', 'edit_customer',
            'make_calls', 'view_call_history',
            'view_orders', 'create_order',
            'view_products'
        ]

        # Features for Employee
        employee_features = [
            'view_dashboard',
            'view_customers', 'create_customer', 'edit_customer', 'manage_appointments',
            'view_orders', 'create_order', 'edit_order',
            'view_products'
        ]

        # Seed Admin permissions (all enabled)
        for feat in all_features:
            RoleFeaturePermission.objects.update_or_create(
                role=admin_role,
                feature_key=feat,
                defaults={'is_enabled': True}
            )

        # Seed Telecaller permissions
        for feat in all_features:
            RoleFeaturePermission.objects.update_or_create(
                role=telecaller_role,
                feature_key=feat,
                defaults={'is_enabled': (feat in telecaller_features)}
            )

        # Seed Employee permissions
        for feat in all_features:
            RoleFeaturePermission.objects.update_or_create(
                role=employee_role,
                feature_key=feat,
                defaults={'is_enabled': (feat in employee_features)}
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded roles and feature permissions!"))
