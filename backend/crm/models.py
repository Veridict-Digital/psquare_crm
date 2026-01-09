from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('Employee', 'Employee'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='Employee')
    pincode_territory = models.CharField(max_length=10, blank=True, null=True)

class Customer(models.Model):
    CONTACT_TYPES = [
        ('Customer', 'Customer'),
        ('Lead', 'Lead'),
    ]
    name = models.CharField(max_length=100)
    company_name = models.CharField(max_length=100, blank=True, null=True)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15, unique=True)
    contact_type = models.CharField(max_length=20, choices=CONTACT_TYPES, default='Customer')
    # Structured Address Fields
    house_flat_no = models.CharField(max_length=50, blank=True, null=True)
    wing_lane = models.CharField(max_length=100, blank=True, null=True)
    society_colony = models.CharField(max_length=100, blank=True, null=True)
    landmark = models.CharField(max_length=100, blank=True, null=True)
    area = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10)
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
        # Determine contact type based on provided information
        if not self.pk:  # Only on creation
            # If only phone is provided (minimal info), it's a Lead
            has_full_info = (
                self.name and self.name.strip() and
                self.pincode and self.pincode != '000000' and
                (self.house_flat_no or self.area or self.city)
            )
            self.contact_type = 'Customer' if has_full_info else 'Lead'

        # Convert Lead to Customer when appointment_date is set
        if self.contact_type == 'Lead' and self.appointment_date:
            self.contact_type = 'Customer'

        # Only assign agent based on pincode if no agent is set (on creation or if agent is None)
        if not self.agent:
            agent = User.objects.filter(pincode_territory=self.pincode, role='Employee').first()
            if agent:
                self.agent = agent
        super().save(*args, **kwargs)

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
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

class Product(models.Model):
    pid = models.CharField(max_length=20, unique=True, blank=True, null=True)  # Unique Product ID
    sku = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    stock_qty = models.IntegerField()
    mrp = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # MRP
    b2c_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # B2C Price
    b2b_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # B2B Price
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    gst_rate = models.ForeignKey(GSTRate, on_delete=models.SET_NULL, null=True, blank=True)
    gst_calculated_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)  # GST Calculated Amount
    use_case = models.TextField(blank=True, null=True)  # Use Case
    image = models.ImageField(upload_to='products/', blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.pid:
            # Generate unique PID
            import uuid
            self.pid = f"P{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    

class Order(models.Model):
    STATUS_CHOICES = [
        ('Placed', 'Placed'),
        ('Dispatched', 'Dispatched'),
        ('Delivered', 'Delivered'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('Paid', 'Full Paid'),
        ('Partial', 'Partial'),
        ('Credit', 'Credit'),
    ]
    order_id = models.CharField(max_length=20, unique=True, blank=True, null=True)  # Unique Order ID
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    agent = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Placed')
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='Paid')
    followup_date = models.DateField(blank=True, null=True)
    order_date = models.DateField(auto_now_add=True)

    def clean(self):
        if self.payment_status == 'Credit' and not self.followup_date:
            raise ValidationError("Followup date is required for credit payments.")

    def save(self, *args, **kwargs):
        if not self.order_id:
            # Generate unique Order ID
            import uuid
            self.order_id = f"ORD{uuid.uuid4().hex[:8].upper()}"
        self.full_clean()
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        # Calculate total price including GST
        gst_amount = (self.unit_price * self.quantity * self.gst_rate) / 100
        self.total_price = (self.unit_price * self.quantity) + gst_amount
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
        ('Completed', 'Completed'),
        ('Follow-up', 'Follow-up'),
    ]

    call_id = models.CharField(max_length=20, unique=True, blank=True, null=True)  # Unique Call ID
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True)
    lead = models.ForeignKey('Lead', on_delete=models.CASCADE, null=True, blank=True)
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='call_logs', null=True, blank=True)  # Add this
    date = models.DateTimeField(auto_now_add=True)  # Add this
    duration = models.DurationField()
    note = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='call_logs')
    assumption = models.ManyToManyField(CustomerAssumption, blank=True)
    assumption2 = models.ManyToManyField(CustomerAssumption2, blank=True)
    assumption3 = models.ManyToManyField(CustomerAssumption3, blank=True)

    def save(self, *args, **kwargs):
        if not self.call_id:
            # Generate unique Call ID
            import uuid
            self.call_id = f"CALL{uuid.uuid4().hex[:8].upper()}"
        else:
            # If call_id is provided (from call tracker), use it but ensure uniqueness
            # Check if this call_id already exists
            if CallLog.objects.filter(call_id=self.call_id).exists():
                # If it exists, generate a new one
                import uuid
                self.call_id = f"CALL{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        if self.customer:
            return f"Call Log #{self.call_id} - {self.customer.name}"
        elif self.lead:
            return f"Call Log #{self.call_id} - {self.lead.name or 'Unknown Lead'}"
        else:
            return f"Call Log #{self.call_id}"

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
