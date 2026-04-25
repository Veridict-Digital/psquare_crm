from rest_framework import serializers
from django.db import models
from .models import User, Customer, Product, Order, OrderItem, CallLog, CustomerAssumption, CustomerAssumption2, CustomerAssumption3, Lead, GSTRate, Category, ProductCombination, CombinationItem, CombinationReward, CombinationGift, Phone, OrganizationType, CustomerType, Unit, Brand, BrandCategory, ProductPricing, OldOrderHistory

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'pincode_territory', 'password',
                  'first_name', 'middle_name', 'last_name', 'aadhar_number', 'pan_number',
                  'phone_number', 'address', 'date_of_birth', 'gender', 'emergency_contact_name',
                  'emergency_contact_phone', 'joining_date', 'salary', 'bank_account_number',
                  'bank_name', 'ifsc_code']
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
    customer_type_display = serializers.CharField(source='customer_type.name', read_only=True)

    # ADD THIS FIELD
    telecaller_id = serializers.PrimaryKeyRelatedField(
        source='agent', 
        queryset=User.objects.filter(role__in=['Employee', 'Telecaller']),
        write_only=True,
        required=False,
        allow_null=True
    )

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
    category1_display = serializers.CharField(source='category1.name', read_only=True, allow_null=True)
    category2_display = serializers.CharField(source='category2.name', read_only=True, allow_null=True)
    category3_display = serializers.CharField(source='category3.name', read_only=True, allow_null=True)
    category4_display = serializers.CharField(source='category4.name', read_only=True, allow_null=True)

    brand_display = serializers.CharField(source='brand.name', read_only=True)
    brand_category_display = serializers.CharField(source='brand_category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        extra_kwargs = {
            'cost': {'write_only': True},
            'image': {'required': False, 'allow_null': True},
            'brand': {'required': False, 'allow_null': True},  # Changed from brand_name
            'brand_category': {'required': False, 'allow_null': True},  # Changed from brand_category
        }

    def to_representation(self, instance):
        """Override to add full URL for image in GET responses"""
        response = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            if request:
                response['image'] = request.build_absolute_uri(instance.image.url)
        return response

# ProductPricing Serializer
# ProductPricing Serializer - FIXED VERSION
class ProductPricingSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    category_display = serializers.CharField(source='product.category.name', read_only=True, allow_null=True)
    category1_display = serializers.CharField(source='product.category1.name', read_only=True, allow_null=True)
    category2_display = serializers.CharField(source='product.category2.name', read_only=True, allow_null=True)
    category3_display = serializers.CharField(source='product.category3.name', read_only=True, allow_null=True)
    category4_display = serializers.CharField(source='product.category4.name', read_only=True, allow_null=True)
    product_weight = serializers.CharField(source='product.product_weight', read_only=True)
    unit = serializers.CharField(source='product.unit', read_only=True)
    hsn = serializers.CharField(source='product.hsn', read_only=True)

    class Meta:
        model = ProductPricing
        fields = [
            'id', 'product', 'product_title', 'product_sku', 'category_display',
            'category1_display', 'category2_display', 'category3_display', 'category4_display',
            'product_weight', 'unit', 'hsn',
            # Cost components
            'purchase_type', 'purchase_value',
            'transport_type', 'transport_value',
            'labor_type', 'labor_value',
            'handling_type', 'handling_value',
            'godown_type', 'godown_value',
            'delivery_type', 'delivery_value',
            'packaging_type', 'packaging_value',  # ✅ ADDED
            'extra1_type', 'extra1_value',        # ✅ ADDED
            'extra2_type', 'extra2_value',        # ✅ ADDED
            'landing_type', 'landing_value',
            'company_margin_type', 'company_margin_value',
            # Computed
            'landing_rate', 'calculated_rate', 'sale_rate', 'mrp', 'mfg_date', 'batch_no',
            'created_at', 'updated_at'

        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'landing_rate', 'calculated_rate', 
            'hsn', 'product_title', 'product_sku', 'category_display', 
            'category1_display', 'category2_display', 'category3_display', 
            'category4_display', 'product_weight', 'unit'
        ]

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'description']


class BrandCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandCategory
        fields = ['id', 'name', 'description']

class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    gst_rate_display = serializers.CharField(source='gst_rate.rate', read_only=True)
    combo_name = serializers.CharField(source='combo.name', read_only=True, allow_null=True)
    combo_id = serializers.IntegerField(source='combo.id', read_only=True, allow_null=True)

    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'unit_price', 'gst_rate', 'total_price', 'product_title', 'product_sku', 'gst_rate_display', 'is_free', 'is_gift', 'combo', 'combo_name', 'combo_id']
        extra_kwargs = {
            'total_price': {'read_only': True},
            'product_title': {'read_only': True},
            'product_sku': {'read_only': True},
            'gst_rate_display': {'read_only': True},
            'combo_name': {'read_only': True},
            'combo_id': {'read_only': True},
            'original_price': {'read_only': True}
        }

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())
    customer_details = CustomerSerializer(source='customer', read_only=True)
    agent_name = serializers.SerializerMethodField()
    delivery_address = serializers.JSONField(required=False, allow_null=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        view = self.context.get('view')
        if request and (request.method in ['PUT', 'PATCH'] or (view and getattr(view, 'action', None) == 'list')):
            self.fields['items'].read_only = True

    def get_agent_name(self, obj):
        return obj.agent.username if obj.agent else 'Unknown'

    def create(self, validated_data):
        from django.db import transaction
        import logging
        import datetime
        logger = logging.getLogger('order_debug')
        items_data = validated_data.pop('items')
        applied_combos = validated_data.pop('applied_combos', [])
        # Handle delivery address (structured and legacy)
        delivery_address = validated_data.pop('delivery_address', None)
        logger.warning(f"Order create: delivery_address={delivery_address}, validated_data={validated_data}")
        if isinstance(delivery_address, dict):
            for field in [
                'house_flat_no', 'wing_lane', 'society_colony', 'landmark', 'area', 'pincode',
                'state', 'district', 'tahsil', 'city']:
                validated_data[f'delivery_{field}'] = delivery_address.get(field, '')
            validated_data['delivery_address'] = ', '.join([delivery_address.get(f, '') for f in [
                'house_flat_no', 'wing_lane', 'society_colony', 'landmark', 'area', 'city', 'district', 'state', 'pincode'] if delivery_address.get(f)])
        elif isinstance(delivery_address, str):
            validated_data['delivery_address'] = delivery_address
        logger.warning(f"Order create after mapping: validated_data={validated_data}")
        if not validated_data.get('customer'):
            raise serializers.ValidationError('Customer is required.')
        if not items_data or len(items_data) == 0:
            raise serializers.ValidationError('At least one order item is required.')
        # Set order_date to today if not provided
        if not validated_data.get('order_date'):
            validated_data['order_date'] = datetime.date.today()
        with transaction.atomic():
            order = Order.objects.create(**validated_data, applied_combos=applied_combos)
            for item_data in items_data:
                order_item = OrderItem.objects.create(order=order, **item_data)
                if not item_data.get('is_free') and not item_data.get('is_gift'):
                    product = item_data['product']
                    quantity = item_data['quantity']
                    product.stock_qty -= quantity
                    product.save()
            logger.warning(f"Order created: {order}")
            return order

    def update(self, instance, validated_data):
        import datetime
        items_data = validated_data.pop('items', None)
        applied_combos = validated_data.pop('applied_combos', None)
        if applied_combos is not None:
            instance.applied_combos = applied_combos
        # Explicit validation
        if not validated_data.get('customer'):
            raise serializers.ValidationError('Customer is required.')
        if items_data is not None and len(items_data) == 0:
            raise serializers.ValidationError('At least one order item is required.')
        # Set order_date to today if not provided
        if not validated_data.get('order_date'):
            validated_data['order_date'] = datetime.date.today()
        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Safely update items if provided
        if items_data is not None:
            from django.db import transaction
            with transaction.atomic():
                # Delete existing items
                instance.items.all().delete()
                # Create new items with safe FK handling
                for item_data in items_data:
                    combo = None
                    if item_data.get('combo'):
                        try:
                            combo = ProductCombination.objects.get(id=item_data['combo'])
                            item_data['combo'] = combo
                        except ProductCombination.DoesNotExist:
                            item_data.pop('combo', None)  # Remove invalid combo

                    order_item = OrderItem.objects.create(order=instance, **item_data)
                    # Update product stock ONLY for paid items (no double deduction on update)
                    if not item_data.get('is_free') and not item_data.get('is_gift'):
                        product = item_data['product']
                        quantity = item_data['quantity']
                        # Only deduct if creating new (stock already handled on original create)
                        # Skip stock adjustment on updates to avoid double deduction

        return instance

    class Meta:
        model = Order
        fields = ['id', 'order_id', 'customer', 'customer_details', 'agent', 'total_amount', 'paid_amount', 'status', 'payment_status', 'followup_date', 'delivery_address', 'delivery_house_flat_no', 'delivery_wing_lane', 'delivery_society_colony', 'delivery_landmark', 'delivery_area', 'delivery_pincode', 'delivery_state', 'delivery_district', 'delivery_tahsil', 'delivery_city', 'order_date', 'created_at', 'customer_name', 'agent_name', 'items', 'applied_combos']
        extra_kwargs = {
            'agent': {'required': False},
            'applied_combos': {'required': False}
        }

class OldOrderHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OldOrderHistory
        fields = ['id', 'customer', 'date', 'notes', 'amount', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
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
        fields = ['id', 'call_id', 'customer', 'lead', 'customer_name', 'employee', 'employee_name', 'duration', 'duration_minutes', 'note', 'status', 'date', 'saved_at', 'order_placed', 'order_id', 'order_pk', 'assumption', 'assumption_names', 'assumption2', 'assumption2_names', 'assumption3', 'assumption3_names']

class CategorySerializer(serializers.ModelSerializer):
    children_count = serializers.SerializerMethodField()
    
    def get_children_count(self, obj):
        return obj.children.count()

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
        fields = ['id', 'product', 'product_title', 'quantity']

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
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'combo_weight', 'curriar_purchase_point', 'curriar_dispatch_point', 'items', 'rewards', 'gifts', 'items_data', 'rewards_data', 'gifts_data']

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
            quantity = gift_data.get('quantity', 1)
            if product_id:
                CombinationGift.objects.create(
                    combination=instance,
                    product_id=product_id,
                    quantity=quantity
                )

        return instance

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'

class CustomerTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerType
        fields = '__all__'

