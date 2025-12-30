from rest_framework import serializers
from .models import User, Customer, Product, Order, OrderItem, CallLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'pincode_territory']

class CustomerSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.username', read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'unit_price', 'gst_rate', 'total_price', 'product_title', 'product_sku']
        extra_kwargs = {
            'total_price': {'read_only': True},
            'product_title': {'read_only': True},
            'product_sku': {'read_only': True}
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

class CallLogSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    employee_name = serializers.CharField(source='employee.username', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    order_placed = serializers.SerializerMethodField()
    order_id = serializers.SerializerMethodField()
    order_pk = serializers.SerializerMethodField()

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
        fields = ['id', 'call_id', 'customer', 'customer_name', 'employee', 'employee_name', 'duration', 'duration_minutes', 'note', 'status', 'date', 'order_placed', 'order_id', 'order_pk']
