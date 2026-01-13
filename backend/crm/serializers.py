from rest_framework import serializers
from django.db import models
from .models import User, Customer, Product, Order, OrderItem, CallLog, CustomerAssumption, CustomerAssumption2, CustomerAssumption3, Lead, GSTRate, Category, ProductCombination, CombinationItem, CombinationReward, CombinationGift, Phone, OrganizationType

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

class PhoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Phone
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.username', read_only=True)
    total_order_value = serializers.SerializerMethodField()
    outstanding_amount = serializers.SerializerMethodField()
    phones = PhoneSerializer(many=True, read_only=True)
    company_type_display = serializers.CharField(source='company_type.name', read_only=True)
    customer_type_display = serializers.CharField(source='get_customer_type_display', read_only=True)

    def get_total_order_value(self, obj):
        # Calculate total order value from all orders for this customer
        total = obj.order_set.aggregate(total=models.Sum('total_amount'))['total'] or 0
        return total

    def get_outstanding_amount(self, obj):
        # Calculate outstanding amount from orders with partial or credit payment status
        outstanding = obj.order_set.filter(
            models.Q(payment_status='Partial') | models.Q(payment_status='Credit')
        ).aggregate(
            outstanding=models.Sum(models.F('total_amount') - models.F('paid_amount'))
        )['outstanding'] or 0
        return outstanding

    class Meta:
        model = Customer
        fields = '__all__'
        extra_kwargs = {
            'kyc_file': {'required': False},
            'agent': {'required': False},
            'created_at': {'read_only': True},
            'name': {'required': False},
            'pincode': {'required': False},
        }
        read_only_fields = ['outstanding_amount']

class ProductSerializer(serializers.ModelSerializer):
    gst_rate_display = serializers.CharField(source='gst_rate.rate', read_only=True)
    gst_rate_description = serializers.CharField(source='gst_rate.description', read_only=True)
    category_display = serializers.CharField(source='category.name', read_only=True)
    image = serializers.SerializerMethodField()

    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

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
        fields = ['id', 'order_id', 'customer', 'agent', 'total_amount', 'paid_amount', 'status', 'payment_status', 'followup_date', 'delivery_address', 'order_date', 'customer_name', 'agent_name', 'items']
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
    agent_name = serializers.CharField(source='agent.username', read_only=True)

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
    assumption_names = serializers.SerializerMethodField()
    assumption2_names = serializers.SerializerMethodField()
    assumption3_names = serializers.SerializerMethodField()

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

    def get_assumption_names(self, obj):
        return [assumption.name for assumption in obj.assumption.all()]

    def get_assumption2_names(self, obj):
        return [assumption.name for assumption in obj.assumption2.all()]

    def get_assumption3_names(self, obj):
        return [assumption.name for assumption in obj.assumption3.all()]

    class Meta:
        model = CallLog
        fields = ['id', 'call_id', 'customer', 'lead', 'customer_name', 'employee', 'employee_name', 'duration', 'duration_minutes', 'note', 'status', 'date', 'order_placed', 'order_id', 'order_pk', 'assumption', 'assumption_names', 'assumption2', 'assumption2_names', 'assumption3', 'assumption3_names']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class OrganizationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationType
        fields = '__all__'

class GSTRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSTRate
        fields = '__all__'

class CombinationItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = CombinationItem
        fields = ['id', 'product', 'product_title', 'quantity_required', 'offer_price']

class CombinationRewardSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = CombinationReward
        fields = ['id', 'product', 'product_title', 'quantity_free']

class CombinationGiftSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = CombinationGift
        fields = ['id', 'product', 'product_title']

class ProductCombinationSerializer(serializers.ModelSerializer):
    items = CombinationItemSerializer(many=True, read_only=True)
    rewards = CombinationRewardSerializer(many=True, read_only=True)
    gifts = CombinationGiftSerializer(many=True, read_only=True)
    items_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    rewards_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    gifts_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        allow_empty=True
    )

    class Meta:
        model = ProductCombination
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'items', 'rewards', 'gifts', 'items_data', 'rewards_data', 'gifts_data']

    def create(self, validated_data):
        items_data = validated_data.pop('items_data', [])
        rewards_data = validated_data.pop('rewards_data', [])
        gifts_data = validated_data.pop('gifts_data', [])

        combination = ProductCombination.objects.create(**validated_data)

        # Create combination items
        for item_data in items_data:
            product_id = item_data.get('product')
            quantity_required = item_data.get('quantity_required')
            offer_price = item_data.get('offer_price')
            if product_id and quantity_required:
                CombinationItem.objects.create(
                    combination=combination,
                    product_id=int(product_id),
                    quantity_required=quantity_required,
                    offer_price=offer_price
                )

        # Create combination rewards
        for reward_data in rewards_data:
            product_id = reward_data.get('product')
            quantity_free = reward_data.get('quantity_free')
            if product_id and quantity_free:
                CombinationReward.objects.create(
                    combination=combination,
                    product_id=int(product_id),
                    quantity_free=quantity_free
                )

        # Create combination gifts
        for gift_data in gifts_data:
            product_id = gift_data.get('product')
            if product_id:
                CombinationGift.objects.create(
                    combination=combination,
                    product_id=int(product_id)
                )

        return combination

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items_data', [])
        rewards_data = validated_data.pop('rewards_data', [])
        gifts_data = validated_data.pop('gifts_data', [])

        # Update combination fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Delete existing items, rewards, and gifts
        instance.items.all().delete()
        instance.rewards.all().delete()
        instance.gifts.all().delete()

        # Create new items, rewards, and gifts
        for item_data in items_data:
            product_id = item_data.get('product')
            quantity_required = item_data.get('quantity_required')
            offer_price = item_data.get('offer_price')
            if product_id and quantity_required:
                CombinationItem.objects.create(
                    combination=instance,
                    product_id=product_id,
                    quantity_required=quantity_required,
                    offer_price=offer_price
                )

        for reward_data in rewards_data:
            product_id = reward_data.get('product')
            quantity_free = reward_data.get('quantity_free')
            if product_id and quantity_free:
                CombinationReward.objects.create(
                    combination=instance,
                    product_id=product_id,
                    quantity_free=quantity_free
                )

        for gift_data in gifts_data:
            product_id = gift_data.get('product')
            if product_id:
                CombinationGift.objects.create(
                    combination=instance,
                    product_id=product_id
                )

        return instance
