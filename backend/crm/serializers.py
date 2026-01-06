from rest_framework import serializers
from django.db import models
from .models import User, Customer, Product, Order, OrderItem, CallLog, CustomerAssumption, CustomerAssumption2, CustomerAssumption3, Lead, GSTRate, Category

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'pincode_territory', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class CustomerSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.username', read_only=True)
    total_order_value = serializers.SerializerMethodField()

    def get_total_order_value(self, obj):
        # Calculate total order value from all orders for this customer
        total = obj.order_set.aggregate(total=models.Sum('total_amount'))['total'] or 0
        return total

    class Meta:
        model = Customer
        fields = '__all__'
        extra_kwargs = {
            'kyc_file': {'required': False},
            'agent': {'required': False},
            'created_at': {'read_only': True},
        }

class ProductSerializer(serializers.ModelSerializer):
    gst_rate_display = serializers.CharField(source='gst_rate.rate', read_only=True)
    gst_rate_description = serializers.CharField(source='gst_rate.description', read_only=True)
    category_display = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    gst_rate_display = serializers.CharField(source='gst_rate.rate', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'unit_price', 'gst_rate', 'total_price', 'product_title', 'product_sku', 'gst_rate_display']
        extra_kwargs = {
            'total_price': {'read_only': True},
            'product_title': {'read_only': True},
            'product_sku': {'read_only': True},
            'gst_rate_display': {'read_only': True}
        }

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    agent_name = serializers.SerializerMethodField()

    def get_agent_name(self, obj):
        return obj.agent.username if obj.agent else 'Unknown'

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order

    class Meta:
        model = Order
        fields = ['id', 'order_id', 'customer', 'agent', 'total_amount', 'paid_amount', 'status', 'payment_status', 'followup_date', 'order_date', 'customer_name', 'agent_name', 'items']
        extra_kwargs = {
            'agent': {'required': False}
        }

class CustomerAssumptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAssumption
        fields = '__all__'

class CustomerAssumption2Serializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAssumption2
        fields = '__all__'

class CustomerAssumption3Serializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAssumption3
        fields = '__all__'

class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'

class CallLogSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    employee_name = serializers.CharField(source='employee.username', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    order_placed = serializers.SerializerMethodField()
    order_id = serializers.SerializerMethodField()
    order_pk = serializers.SerializerMethodField()
    assumption_name = serializers.CharField(source='assumption.name', read_only=True)
    assumption2_name = serializers.CharField(source='assumption2.name', read_only=True)
    assumption3_name = serializers.CharField(source='assumption3.name', read_only=True)

    def get_customer_name(self, obj):
        if obj.customer:
            return obj.customer.name
        elif obj.lead:
            return obj.lead.name or 'Unknown Lead'
        return 'Unknown'

    def get_duration_minutes(self, obj):
        if obj.duration:
            return obj.duration.total_seconds() / 60
        return 0

    def get_order_placed(self, obj):
        return 'Yes' if obj.order else 'No'

    def get_order_id(self, obj):
        return obj.order.order_id if obj.order else None

    def get_order_pk(self, obj):
        return obj.order.id if obj.order else None

    class Meta:
        model = CallLog
        fields = ['id', 'call_id', 'customer', 'lead', 'customer_name', 'employee', 'employee_name', 'duration', 'duration_minutes', 'note', 'status', 'date', 'order_placed', 'order_id', 'order_pk', 'assumption', 'assumption_name', 'assumption2', 'assumption2_name', 'assumption3', 'assumption3_name']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class GSTRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSTRate
        fields = '__all__'
