from django.contrib import admin
from .models import User, Customer, Product, Order, CallLog

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'pincode_territory']

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'pincode', 'total_order_value', 'agent']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['sku', 'title', 'stock_qty', 'price', 'cost', 'gst_rate']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['customer', 'agent', 'total_amount', 'paid_amount', 'status', 'payment_status', 'order_date']

@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    list_display = ['customer', 'duration', 'status']
