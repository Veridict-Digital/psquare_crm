from decimal import Decimal

from django import dispatch
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Employee', 'Employee'),
        ('Telecaller', 'Telecaller'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Employee')
    pincode_territory = models.CharField(max_length=10, blank=True, null=True)

    # Additional user details
    first_name = models.CharField(max_length=50, blank=True, null=True)
    middle_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    aadhar_number = models.CharField(max_length=12, blank=True, null=True, unique=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True, unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    bank_account_number = models.CharField(max_length=20, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    ifsc_code = models.CharField(max_length=11, blank=True, null=True)

class OrganizationType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class CustomerType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Customer(models.Model):
    CONTACT_TYPES = [
        ('Customer', 'Customer'),
        ('Lead', 'Lead'),
    ]
    name = models.CharField(max_length=100, blank=True, null=True)
    surname = models.CharField(max_length=100, blank=True, null=True)
    company_name = models.CharField(max_length=100, blank=True, null=True)
    company_type = models.ForeignKey(OrganizationType, on_delete=models.SET_NULL, null=True, blank=True)
    customer_type = models.ForeignKey(CustomerType, on_delete=models.SET_NULL, null=True, blank=True)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15)
    contact_type = models.CharField(max_length=20, choices=CONTACT_TYPES, default='Customer')
    # Structured Address Fields
    house_flat_no = models.CharField(max_length=50, blank=True, null=True)
    wing_lane = models.CharField(max_length=100, blank=True, null=True)
    society_colony = models.CharField(max_length=100, blank=True, null=True)
    landmark = models.CharField(max_length=100, blank=True, null=True)
    area = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    district = models.CharField(max_length=50, blank=True, null=True)
    tahsil = models.CharField(max_length=50, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    # Legacy field for backward compatibility (can be removed later)
    address = models.TextField(blank=True, null=True)
    kyc_file = models.FileField(upload_to='kyc/', blank=True, null=True)
    agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    appointment_date = models.DateField(blank=True, null=True)
    appointment_time = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Always set contact_type to 'Lead' on creation
        if not self.pk:
            self.contact_type = 'Lead'

        # Convert Lead to Customer when appointment_date is set
        if self.contact_type == 'Lead' and self.appointment_date:
            self.contact_type = 'Customer'

        # Only assign agent based on pincode if no agent is set (on creation or if agent is None)
        if not self.agent:
            agent = User.objects.filter(pincode_territory=self.pincode, role='Employee').first()
            if agent:
                self.agent = agent

        super().save(*args, **kwargs)

        # Create Phone instance if phone is provided and no Phone exists for this customer
        if self.phone and not Phone.objects.filter(customer=self, phone=self.phone).exists():
            Phone.objects.create(customer=self, phone=self.phone, is_primary=True)

class Phone(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='phones')
    phone = models.CharField(max_length=15, unique=True)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Ensure only one primary phone per customer
        if self.is_primary:
            Phone.objects.filter(customer=self.customer, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer.name} - {self.phone}"

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')

    def __str__(self):
        return self.name

class Unit(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class GSTRate(models.Model):
    name = models.CharField(max_length=50, unique=True)
    rate = models.DecimalField(max_digits=5, decimal_places=2)  # GST rate in percentage, e.g., 18.00
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.rate}%"
    



# Move Brand and BrandCategory above Product

class Brand(models.Model):
    """Simple Brand model - similar to Category"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'brands'
        ordering = ['name']

    def __str__(self):
        return self.name


class BrandCategory(models.Model):
    """Simple Brand Category model - similar to Category"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'brand_categories'
        ordering = ['name']

    def __str__(self):
        return self.name

class Product(models.Model):

    pid = models.CharField(max_length=20, unique=True, blank=True, null=True)  # Unique Product ID
    sku = models.CharField(max_length=50, unique=True ,blank=True, null=True)  # Stock Keeping Unit
    hsn = models.CharField(max_length=20, blank=True, null=True)    
    title = models.CharField(max_length=100, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    category1 = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products_cat1')
    category2 = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products_cat2')
    category3 = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products_cat3')
    category4 = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products_cat4')
    stock_qty = models.IntegerField()
    mrp = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # MRP
    b2c_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # B2C Price
    b2b_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # B2B Price
    price = models.DecimalField(max_digits=10, decimal_places=2 , blank=True, null=True)  # Selling Price (can be set based on B2C/B2B logic)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # Purchase Price (formerly cost)
    product_volume = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # Product Volume
    unit = models.CharField(max_length=20, blank=True, null=True)  # Unit (e.g., kg, liter, piece)
    product_weight = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # Product Weight
    gst_rate = models.ForeignKey(GSTRate, on_delete=models.SET_NULL, null=True, blank=True)
    gst_calculated_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # GST Calculated Amount
    use_case = models.TextField(blank=True, null=True)  # Use Case
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    image1 = models.ImageField(upload_to='products/gallery/', blank=True, null=True)
    image2 = models.ImageField(upload_to='products/gallery/', blank=True, null=True)
    image3 = models.ImageField(upload_to='products/gallery/', blank=True, null=True)
    image4 = models.ImageField(upload_to='products/gallery/', blank=True, null=True)
    video_link = models.URLField(max_length=500, blank=True, null=True)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    brand_category = models.ForeignKey(BrandCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    flavour = models.CharField(max_length=100, blank=True, null=True)
    residual = models.CharField(max_length=100, blank=True, null=True)


    def save(self, *args, **kwargs):
        if not self.pid:
            # Generate unique PID
            import uuid
            self.pid = f"P{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    

class ProductPricing(models.Model):
    TYPE_CHOICES = [
        ('percent', '%'),
        ('rupees', '₹'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='pricings')
    
    # Cost components with type and value
    purchase_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='rupees')
    purchase_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    transport_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='rupees')
    transport_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    labor_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='rupees')
    labor_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    handling_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='rupees')
    handling_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    godown_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='rupees')
    godown_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    delivery_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='rupees')
    delivery_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    packaging_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='rupees')
    packaging_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    extra1_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='rupees')
    extra1_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    extra2_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='rupees')
    extra2_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    landing_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='rupees')
    landing_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    company_margin_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='percent')
    company_margin_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Manual inputs (editable)
    sale_rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, default=0)
    mrp = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, default=0)
    
    mfg_date = models.DateField(blank=True, null=True)
    batch_no = models.CharField(max_length=100, blank=True, null=True)
    
    # Computed fields (saved)
    landing_rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    calculated_rate = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product',)

    def calculate_cost_component(self, base_amount, cost_type, cost_value):
        """Calculate cost: % of base or fixed ₹"""
        # Handle None values
        if base_amount is None:
            base_amount = Decimal('0')
        if cost_value is None:
            cost_value = Decimal('0')
            
        # Convert to float for calculation
        base_float = float(base_amount)
        cost_float = float(cost_value)
        
        if cost_type == 'percent':
            result = base_float * (cost_float / 100)
        else:
            result = cost_float
        
        # Convert back to Decimal
        from decimal import Decimal
        return Decimal(str(round(result, 2)))

    def save(self, *args, **kwargs):
        # Start with purchase value as base
        base = self.purchase_value if self.purchase_value is not None else Decimal('0')
        
        # Add all sequential costs (do NOT add purchase_value again)
        base += self.calculate_cost_component(base, self.transport_type, self.transport_value or 0)
        base += self.calculate_cost_component(base, self.labor_type, self.labor_value or 0)
        base += self.calculate_cost_component(base, self.handling_type, self.handling_value or 0)
        base += self.calculate_cost_component(base, self.godown_type, self.godown_value or 0)
        base += self.calculate_cost_component(base, self.delivery_type, self.delivery_value or 0)
        base += self.calculate_cost_component(base, self.packaging_type, self.packaging_value or 0)
        base += self.calculate_cost_component(base, self.extra1_type, self.extra1_value or 0)
        base += self.calculate_cost_component(base, self.extra2_type, self.extra2_value or 0)
        
        # Set landing rate (cost before landing charges)
        self.landing_rate = base
        
        # Add landing cost
        base += self.calculate_cost_component(base, self.landing_type, self.landing_value or 0)
        
        # Set calculated rate (cost after landing charges)
        self.calculated_rate = base
        
        # Note: sale_rate and mrp are manual inputs - don't override them
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Pricing for {self.product.title} - Calculated Rate: ₹{self.calculated_rate or 0:.2f}"

class Order(models.Model):
    STATUS_CHOICES = [
        ('ordered', 'Ordered'),
        ('Preparing', 'Preparing'),
        ('Placed', 'Placed'),
        ('Dispatched', 'Dispatched'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled')
    ]
    PAYMENT_STATUS_CHOICES = [
        ('Paid', 'Full Paid'),
        ('Partial', 'Partial'),
        ('Credit', 'Credit'),
        ('Advance', 'Advance'),
    ]
    order_id = models.CharField(max_length=20, unique=True, blank=True, null=True)  # Unique Order ID
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    agent = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Placed')
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='Paid')
    followup_date = models.DateField(blank=True, null=True)
    delivery_address = models.TextField(blank=True, null=True)  # Legacy - use structured fields
    # Structured delivery fields matching Customer model
    delivery_house_flat_no = models.CharField(max_length=50, blank=True, null=True)
    delivery_wing_lane = models.CharField(max_length=100, blank=True, null=True)
    delivery_society_colony = models.CharField(max_length=100, blank=True, null=True)
    delivery_landmark = models.CharField(max_length=100, blank=True, null=True)
    delivery_area = models.CharField(max_length=100, blank=True, null=True)
    delivery_pincode = models.CharField(max_length=10, blank=True, null=True)
    delivery_state = models.CharField(max_length=50, blank=True, null=True)
    delivery_district = models.CharField(max_length=50, blank=True, null=True)
    delivery_tahsil = models.CharField(max_length=50, blank=True, null=True)
    delivery_city = models.CharField(max_length=50, blank=True, null=True)
    order_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    applied_combos = models.JSONField(default=list, blank=True)

    def clean(self):
        pass  # No validation for followup_date; it is now optional for all payment statuses

    def save(self, *args, **kwargs):
        if not self.order_id:
            # Generate sequential Order ID
            last_order = Order.objects.order_by('-id').first()
            if last_order and last_order.id:
                next_id = last_order.id + 1
            else:
                next_id = 1
            self.order_id = f"ORD{next_id:06d}"  # Zero-padded to 6 digits
        self.full_clean()
        super().save(*args, **kwargs)

    def get_full_delivery_address(self):
        """Concatenate structured delivery fields for display."""
        fields = [
            self.delivery_house_flat_no,
            self.delivery_wing_lane,
            self.delivery_society_colony,
            self.delivery_landmark,
            self.delivery_area,
            self.delivery_city,
            self.delivery_district,
            self.delivery_state,
            self.delivery_tahsil,
            self.delivery_pincode,
        ]
        return ', '.join(filter(None, fields))

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_free = models.BooleanField(default=False)
    is_gift = models.BooleanField(default=False)
    combo = models.ForeignKey('ProductCombination', on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')

    def save(self, *args, **kwargs):

        # Calculate total price with inclusive GST
        # For inclusive GST: GST Amount = (unit_price * quantity * gst_rate) / (100 + gst_rate)
        # Total Price = unit_price * quantity (which already includes GST)
        gst_amount = (self.unit_price * self.quantity * self.gst_rate) / (100 + self.gst_rate)
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.title} x{self.quantity} for Order #{self.order.id}"

class CustomerAssumption(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class CustomerAssumption2(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class CustomerAssumption3(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class CallLog(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Follow-up', 'Follow-up'),
    ]
    
    call_id = models.CharField(max_length=20, unique=True, blank=True, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='call_logs')
    lead = models.ForeignKey('Lead', on_delete=models.SET_NULL, null=True, blank=True, related_name='call_logs')
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='call_logs', null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    saved_at = models.DateTimeField(blank=True, null=True)
    duration = models.DurationField()
    note = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='call_logs')
    assumption = models.ManyToManyField(CustomerAssumption, blank=True)
    assumption2 = models.ManyToManyField(CustomerAssumption2, blank=True)
    assumption3 = models.ManyToManyField(CustomerAssumption3, blank=True)
    
    def clean(self):
        from django.core.exceptions import ValidationError
        # FORCE: Every call log MUST have a customer
        if not self.customer:
            raise ValidationError('Customer is required for all call logs')
    
def save(self, *args, **kwargs):
    self.clean()
    # ONLY generate call_id if it doesn't exist (new record)
    if not self.call_id:
        import uuid
        self.call_id = f"CALL{uuid.uuid4().hex[:8].upper()}"
    # DO NOT regenerate call_id for existing records
    super().save(*args, **kwargs)
    
    def __str__(self):
        if self.customer:
            return f"Call Log #{self.call_id} - {self.customer.name}"
        else:
            return f"Call Log #{self.call_id} (Orphaned - Error)"

class Lead(models.Model):
    STATUS_CHOICES = [
        ('New', 'New'),
        ('Contacted', 'Contacted'),
        ('Qualified', 'Qualified'),
        ('Converted', 'Converted'),
        ('Lost', 'Lost'),
    ]
    name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='New')
    notes = models.TextField(blank=True, null=True)
    agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    appointment_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name or 'Unknown'} - {self.phone}"

class OTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20)  # e.g., 'registration', 'password_reset'
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        # OTP expires after 5 minutes
        return timezone.now() > self.created_at + timezone.timedelta(minutes=5)

    def __str__(self):
        return f"OTP for {self.email} - {self.purpose}"

class ProductCombination(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    combo_weight = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    curriar_purchase_point = models.CharField(max_length=100, blank=True, null=True)
    curriar_dispatch_point = models.CharField(max_length=100, blank=True, null=True)


    def __str__(self):
        return self.name

class CombinationItem(models.Model):
    combination = models.ForeignKey(ProductCombination, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity_required = models.IntegerField()
    offer_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # Offer price for this combo

    def __str__(self):
        return f"{self.combination.name} - {self.product.title} x{self.quantity_required}"

class CombinationReward(models.Model):
    combination = models.ForeignKey(ProductCombination, on_delete=models.CASCADE, related_name='rewards')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity_free = models.IntegerField()

    def __str__(self):
        return f"{self.combination.name} - Free {self.product.title} x{self.quantity_free}"

class CombinationGift(models.Model):
    combination = models.ForeignKey(ProductCombination, on_delete=models.CASCADE, related_name='gifts')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.combination.name} - Gift {self.product.title} x{self.quantity}"

