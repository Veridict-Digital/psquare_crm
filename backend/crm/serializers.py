from rest_framework import serializers
from django.db import models
from .models import BrandCategory1, Flavour, Residual, User, Customer, Product, Order, OrderItem, CallLog, CustomerAssumption, CustomerAssumption2, CustomerAssumption3, Lead, GSTRate, Category, ProductCombination, CombinationItem, CombinationReward, CombinationGift, Phone, OrganizationType, CustomerType, Language, Community, Unit, Brand, BrandCategory, ProductPricing, OldOrderHistory, Role, RoleFeaturePermission

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']

class RoleFeaturePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoleFeaturePermission
        fields = ['id', 'role', 'feature_key', 'is_enabled']

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
    language_display = serializers.CharField(source='language.name', read_only=True, allow_null=True)
    community_display = serializers.CharField(source='community.name', read_only=True, allow_null=True)

    # ADD THIS FIELD
    telecaller_id = serializers.PrimaryKeyRelatedField(
        source='agent', 
        queryset=User.objects.exclude(role='Admin'),
        write_only=True,
        required=False,
        allow_null=True
    )

    def validate_gstin_no(self, value):
        if not value or str(value).strip() == "":
            return None
        return value

    def validate_pincode(self, value):
        if not value or str(value).strip() == "" or str(value).strip() == "000000":
            return None
        return value

    def get_total_order_value(self, obj):
        # Calculate total order value from all orders for this customer
        total = obj.order_set.aggregate(total=models.Sum('total_amount'))['total'] or 0
        return total

    def get_outstanding_amount(self, obj):
        # Calculate outstanding amount from orders with partial or credit payment status
        outstanding = obj.order_set.filter(
            models.Q(payment_status='Partial') | models.Q(payment_status='Credit') | models.Q(payment_status='COD')
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
    
    # ADD THESE NEW FIELDS for the frontend filters
    flavour_display = serializers.CharField(source='flavour.name', read_only=True, allow_null=True)
    residual_display = serializers.CharField(source='residual.name', read_only=True, allow_null=True)
    brand_category1_display = serializers.CharField(source='brand_category1.name', read_only=True, allow_null=True)
    unit_display = serializers.CharField(source='unit', read_only=True, allow_null=True)
    packing_weight_unit_display = serializers.CharField(source='packing_weight_unit.name', read_only=True)
    
    # ADD THIS FIELD - This is the important one for the frontend!
    packing_weight_unit_id = serializers.IntegerField(source='packing_weight_unit.id', read_only=True, allow_null=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        extra_kwargs = {
            'cost': {'write_only': True},
            'image': {'required': False, 'allow_null': True},
            'brand': {'required': False, 'allow_null': True},
            'brand_category': {'required': False, 'allow_null': True},
            'flavour': {'required': False, 'allow_null': True},
            'residual': {'required': False, 'allow_null': True},
            'brand_category1': {'required': False, 'allow_null': True},
            'pointer1': {'required': False, 'allow_null': True},
            'pointer2': {'required': False, 'allow_null': True},
            'pointer3': {'required': False, 'allow_null': True},
            'pointer4': {'required': False, 'allow_null': True},
            'pointer5': {'required': False, 'allow_null': True},
            'length_cm': {'required': False, 'allow_null': True},
            'breadth_cm': {'required': False, 'allow_null': True},
            'height_cm': {'required': False, 'allow_null': True},
            'packing_weight': {'required': False, 'allow_null': True},
            'packing_weight_unit': {'required': False, 'allow_null': True},
        }

    def to_representation(self, instance):
        """Override to add full URL for image in GET responses"""
        response = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            if request:
                response['image'] = request.build_absolute_uri(instance.image.url)
        
        # Ensure unit is properly handled
        if instance.unit:
            if hasattr(instance.unit, 'name'):
                response['unit_display'] = instance.unit.name
                response['unit'] = instance.unit.name
            else:
                response['unit_display'] = instance.unit
                response['unit'] = instance.unit
        else:
            response['unit_display'] = ''
            response['unit'] = ''
        
        # Ensure flavour is properly handled
        if instance.flavour:
            response['flavour_display'] = instance.flavour.name
        else:
            response['flavour_display'] = ''
        
        # Ensure residual is properly handled
        if instance.residual:
            response['residual_display'] = instance.residual.name
        else:
            response['residual_display'] = ''
        
        # Ensure brand_category1 is properly handled
        if instance.brand_category1:
            response['brand_category1_display'] = instance.brand_category1.name
        else:
            response['brand_category1_display'] = ''
        
        # Ensure packing_weight_unit_id is properly set
        if instance.packing_weight_unit:
            response['packing_weight_unit_id'] = instance.packing_weight_unit.id
            response['packing_weight_unit_display'] = instance.packing_weight_unit.name
        else:
            response['packing_weight_unit_id'] = None
            response['packing_weight_unit_display'] = None
        
        # Serialize related ProductPricing if it exists
        pricing_instance = instance.pricings.first()
        if pricing_instance:
            response['pricing'] = ProductPricingSerializer(pricing_instance, context=self.context).data
        else:
            response['pricing'] = None

        return response

# ProductPricing Serializer
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
    
    # ADD THESE NEW FIELDS
    flavour_display = serializers.CharField(source='product.flavour.name', read_only=True, allow_null=True)
    residual_display = serializers.CharField(source='product.residual.name', read_only=True, allow_null=True)
    brand_category1_display = serializers.CharField(source='product.brand_category1.name', read_only=True, allow_null=True)
    gst_rate_display = serializers.CharField(source='product.gst_rate.rate', read_only=True, allow_null=True)
    unit_display = serializers.CharField(source='product.unit', read_only=True)

    class Meta:
        model = ProductPricing
        fields = [
            'id', 'product', 'product_title', 'product_sku', 'category_display',
            'category1_display', 'category2_display', 'category3_display', 'category4_display',
            'product_weight', 'unit', 'hsn',
            'flavour_display', 'residual_display', 'brand_category1_display', 
            'gst_rate_display', 'unit_display',  # ADD THESE
            # Cost components
            'purchase_type', 'purchase_value',
            'transport_type', 'transport_value',
            'labor_type', 'labor_value',
            'handling_type', 'handling_value',
            'godown_type', 'godown_value',
            'delivery_type', 'delivery_value',
            'packaging_type', 'packaging_value',
            'extra1_type', 'extra1_value',
            'extra2_type', 'extra2_value',
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
            'category4_display', 'product_weight', 'unit',
            'flavour_display', 'residual_display', 'brand_category1_display', 
            'gst_rate_display', 'unit_display'  # ADD THESE
        ]

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'description']


class BrandCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandCategory
        fields = ['id', 'name', 'description']

class FlavourSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flavour
        fields = ['id', 'name', 'description', 'is_active']


class ResidualSerializer(serializers.ModelSerializer):
    class Meta:
        model = Residual
        fields = ['id', 'name', 'description', 'is_active']


class BrandCategory1Serializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    children_count = serializers.SerializerMethodField()
    
    def get_children_count(self, obj):
        return obj.children.count()
    
    class Meta:
        model = BrandCategory1
        fields = ['id', 'name', 'description', 'parent', 'parent_name', 'is_active', 'children_count', 'created_at', 'updated_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    gst_rate_display = serializers.CharField(source='gst_rate.rate', read_only=True)
    combo_name = serializers.CharField(source='combo.name', read_only=True, allow_null=True)
    combo_id = serializers.IntegerField(source='combo.id', read_only=True, allow_null=True)

    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'unit_price', 'gst_rate', 'total_price', 'product_title', 'product_sku', 'gst_rate_display', 'is_free', 'is_gift', 'combo', 'combo_name', 'combo_id', 'mrp']
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
    created_by_name = serializers.SerializerMethodField()
    delivery_address = serializers.JSONField(required=False, allow_null=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        view = self.context.get('view')
        if request and (request.method in ['PUT', 'PATCH'] or (view and getattr(view, 'action', None) == 'list')):
            data = getattr(request, 'data', None)
            if not (isinstance(data, dict) and 'items' in data):
                self.fields['items'].read_only = True

    def get_agent_name(self, obj):
        return obj.agent.username if obj.agent else 'Unknown'

    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else 'Unknown'

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
        if delivery_address is not None:
            if isinstance(delivery_address, str):
                import json
                import ast
                try:
                    parsed = json.loads(delivery_address)
                    if isinstance(parsed, dict):
                        delivery_address = parsed
                except (ValueError, TypeError):
                    try:
                        parsed = ast.literal_eval(delivery_address)
                        if isinstance(parsed, dict):
                            delivery_address = parsed
                    except (ValueError, SyntaxError, TypeError):
                        pass

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

        # Populate created_by from request context
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['created_by'] = request.user

        with transaction.atomic():
            order = Order.objects.create(**validated_data, applied_combos=applied_combos)
            for item_data in items_data:
                order_item = OrderItem.objects.create(order=order, **item_data)
                if not item_data.get('is_free') and not item_data.get('is_gift'):
                    product = item_data['product']
                    quantity = item_data['quantity']
                    product.stock_qty -= quantity
                    product.save()
            order.total_amount = sum(item.total_price for item in order.items.all())
            order.save()
            logger.warning(f"Order created: {order}")
            return order

    def update(self, instance, validated_data):
        import datetime
        items_data = validated_data.pop('items', None)
        applied_combos = validated_data.pop('applied_combos', None)
        if applied_combos is not None:
            instance.applied_combos = applied_combos

        # Handle delivery address (structured and legacy)
        delivery_address = validated_data.pop('delivery_address', None)
        if delivery_address is not None:
            if isinstance(delivery_address, str):
                import json
                import ast
                try:
                    parsed = json.loads(delivery_address)
                    if isinstance(parsed, dict):
                        delivery_address = parsed
                except (ValueError, TypeError):
                    try:
                        parsed = ast.literal_eval(delivery_address)
                        if isinstance(parsed, dict):
                            delivery_address = parsed
                    except (ValueError, SyntaxError, TypeError):
                        pass

            if isinstance(delivery_address, dict):
                for field in [
                    'house_flat_no', 'wing_lane', 'society_colony', 'landmark', 'area', 'pincode',
                    'state', 'district', 'tahsil', 'city']:
                    setattr(instance, f'delivery_{field}', delivery_address.get(field, ''))
                instance.delivery_address = ', '.join([delivery_address.get(f, '') for f in [
                    'house_flat_no', 'wing_lane', 'society_colony', 'landmark', 'area', 'city', 'district', 'state', 'pincode'] if delivery_address.get(f)])
            elif isinstance(delivery_address, str):
                instance.delivery_address = delivery_address

        # Explicit validation
        if not validated_data.get('customer'):
            raise serializers.ValidationError('Customer is required.')
        if items_data is not None and len(items_data) == 0:
            raise serializers.ValidationError('At least one order item is required.')
        # Set order_date to today if not provided and not set on instance
        if not validated_data.get('order_date') and not getattr(instance, 'order_date', None):
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
                
                # Recalculate total_amount based on actual items
                instance.total_amount = sum(item.total_price for item in instance.items.all())
                instance.save()
        else:
            # Recalculate total_amount even if items are not updated (only if there are items)
            if instance.items.exists():
                instance.total_amount = sum(item.total_price for item in instance.items.all())
                instance.save()

        return instance

    class Meta:
        model = Order
        fields = ['id', 'order_id', 'customer', 'customer_details', 'agent', 'total_amount', 'paid_amount', 'status', 'payment_status', 'followup_date', 'delivery_address', 'delivery_house_flat_no', 'delivery_wing_lane', 'delivery_society_colony', 'delivery_landmark', 'delivery_area', 'delivery_pincode', 'delivery_state', 'delivery_district', 'delivery_tahsil', 'delivery_city', 'order_date', 'created_at', 'customer_name', 'agent_name', 'created_by', 'created_by_name', 'items', 'applied_combos']
        read_only_fields = ['created_by', 'created_by_name']
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
    customer_phone = serializers.SerializerMethodField()
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

    def get_customer_phone(self, obj):
        if obj.customer:
            return obj.customer.phone
        elif obj.lead:
            return obj.lead.phone
        return '—'

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
        fields = ['id', 'call_id', 'customer', 'lead', 'customer_name', 'customer_phone', 'employee', 'employee_name', 'duration', 'duration_minutes', 'note', 'status', 'date', 'saved_at', 'order_placed', 'order_id', 'order_pk', 'assumption', 'assumption_names', 'assumption2', 'assumption2_names', 'assumption3', 'assumption3_names']

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

# In serializers.py - Update ProductCombinationSerializer

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
        fields = [
            'id', 'name', 'description', 'is_active', 'created_at', 
            'combo_weight', 'curriar_purchase_point', 'curriar_dispatch_point',
            'parking_charge_type', 'parking_charge_value',
            'transportation_charge_type', 'transportation_charge_value',
            'handling_charge_type', 'handling_charge_value',
            'delivery_charge_type', 'delivery_charge_value',
            'extra_charge_type', 'extra_charge_value',
            'total_charges', 'final_combo_price','manual_combo_price',
            'items', 'rewards', 'gifts', 
            'items_data', 'rewards_data', 'gifts_data'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items_data', [])
        rewards_data = validated_data.pop('rewards_data', [])
        gifts_data = validated_data.pop('gifts_data', [])
        
        # Calculate total charges and final price
        # You can add calculation logic here or in the model save method
        validated_data['total_charges'] = 0  # Will be calculated
        validated_data['final_combo_price'] = 0  # Will be calculated

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
            quantity = gift_data.get('quantity', 1)
            if product_id:
                CombinationGift.objects.create(
                    combination=combination,
                    product_id=int(product_id),
                    quantity=quantity
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

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = '__all__'

class CommunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Community
        fields = '__all__'

