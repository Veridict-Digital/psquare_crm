from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Category
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import models
from .models import User, Customer, Product, Order, CallLog, CustomerAssumption, CustomerAssumption2, CustomerAssumption3, Lead, GSTRate, Category
from .serializers import UserSerializer, CustomerSerializer, ProductSerializer, OrderSerializer, CallLogSerializer, CustomerAssumptionSerializer, CustomerAssumption2Serializer, CustomerAssumption3Serializer, LeadSerializer, GSTRateSerializer, CategorySerializer

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, ExpressionWrapper, DecimalField, Sum, Count, Q

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get date filters from query parameters
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        # Base queryset for orders
        orders_queryset = Order.objects.all()
        if date_from:
            orders_queryset = orders_queryset.filter(order_date__gte=date_from)
        if date_to:
            orders_queryset = orders_queryset.filter(order_date__lte=date_to)

        # Base queryset for customers
        customers_queryset = Customer.objects.all()
        if date_from:
            customers_queryset = customers_queryset.filter(created_at__gte=date_from)
        if date_to:
            customers_queryset = customers_queryset.filter(created_at__lte=date_to)

        # Base queryset for call logs
        calllogs_queryset = CallLog.objects.all()
        if date_from:
            calllogs_queryset = calllogs_queryset.filter(date__gte=date_from)
        if date_to:
            calllogs_queryset = calllogs_queryset.filter(date__lte=date_to)

        total_revenue = orders_queryset.aggregate(total=Sum('total_amount'))['total'] or 0
        profit_expr = ExpressionWrapper(F('total_amount') - F('paid_amount'), output_field=DecimalField())
        total_profit = orders_queryset.aggregate(total=Sum(profit_expr))['total'] or 0

        # Monthly revenue data (filtered by date range or last 6 months)
        from django.db.models.functions import TruncMonth
        from django.utils import timezone
        import datetime

        if date_from and date_to:
            # Use the provided date range
            monthly_revenue = orders_queryset.annotate(month=TruncMonth('order_date'))\
                .values('month')\
                .annotate(revenue=Sum('total_amount'))\
                .order_by('month')
        else:
            # Default to last 6 months if no date range provided
            six_months_ago = timezone.now() - datetime.timedelta(days=180)
            monthly_revenue = Order.objects.filter(order_date__gte=six_months_ago)\
                .annotate(month=TruncMonth('order_date'))\
                .values('month')\
                .annotate(revenue=Sum('total_amount'))\
                .order_by('month')

        monthly_revenue_data = []
        for item in monthly_revenue:
            monthly_revenue_data.append({
                'month': item['month'].strftime('%b'),
                'revenue': float(item['revenue'])
            })

        # If no data, leave empty

        # Order status over time (filtered by date range or last 7 months)
        if date_from and date_to:
            # Use the provided date range
            order_status_data = orders_queryset.annotate(month=TruncMonth('order_date'))\
                .values('month', 'status')\
                .annotate(count=Count('id'))\
                .order_by('month')
        else:
            # Default to last 7 months if no date range provided
            seven_months_ago = timezone.now() - datetime.timedelta(days=210)
            order_status_data = Order.objects.filter(order_date__gte=seven_months_ago)\
                .annotate(month=TruncMonth('order_date'))\
                .values('month', 'status')\
                .annotate(count=Count('id'))\
                .order_by('month')

        status_trends = {}
        for item in order_status_data:
            month_key = item['month'].strftime('%Y-%m-%d')
            if month_key not in status_trends:
                status_trends[month_key] = {'completed': 0, 'pending': 0, 'cancelled': 0}
            if item['status'] == 'Delivered':
                status_trends[month_key]['completed'] = item['count']
            elif item['status'] == 'Placed':
                status_trends[month_key]['pending'] = item['count']
            elif item['status'] == 'Dispatched':
                status_trends[month_key]['pending'] = status_trends[month_key]['pending'] + item['count']
            # Note: No 'Cancelled' status exists in the model, so cancelled will remain 0

        # If no data, leave empty

        # Customer segmentation (simplified)
        total_customers = customers_queryset.count()
        if date_from and date_to:
            # Use the provided date range for new customers
            new_customers = customers_queryset.filter(created_at__gte=date_from, created_at__lte=date_to).count()
        else:
            # Default to last 30 days if no date range provided
            new_customers = Customer.objects.filter(created_at__gte=timezone.now() - datetime.timedelta(days=30)).count()
        returning_customers = total_customers - new_customers

        # VIP customers based on orders within the date range
        if date_from and date_to:
            vip_customers = Customer.objects.annotate(
                total_order_value=Sum('order__total_amount', filter=Q(order__order_date__gte=date_from, order__order_date__lte=date_to))
            ).filter(total_order_value__gte=50000).count()
        else:
            # Default to all time if no date range provided
            vip_customers = Customer.objects.annotate(
                total_order_value=Sum('order__total_amount')
            ).filter(total_order_value__gte=50000).count()

        customer_segments = [new_customers, returning_customers, vip_customers]

        # Performance trends (filtered by date range or last 7 months)
        if date_from and date_to:
            # Use the provided date range
            performance_data = orders_queryset.annotate(month=TruncMonth('order_date'))\
                .values('month')\
                .annotate(
                    revenue=Sum('total_amount'),
                    orders=Count('id')
                )\
                .order_by('month')

            customers_trend = customers_queryset.annotate(month=TruncMonth('created_at'))\
                .values('month')\
                .annotate(customers=Count('id'))\
                .order_by('month')
        else:
            # Default to last 7 months if no date range provided
            seven_months_ago = timezone.now() - datetime.timedelta(days=210)
            performance_data = Order.objects.filter(order_date__gte=seven_months_ago)\
                .annotate(month=TruncMonth('order_date'))\
                .values('month')\
                .annotate(
                    revenue=Sum('total_amount'),
                    orders=Count('id')
                )\
                .order_by('month')

            customers_trend = Customer.objects.filter(created_at__gte=seven_months_ago)\
                .annotate(month=TruncMonth('created_at'))\
                .values('month')\
                .annotate(customers=Count('id'))\
                .order_by('month')

        performance_trends = []
        for item in performance_data:
            month_key = item['month'].strftime('%b')
            customers_count = next((c['customers'] for c in customers_trend if c['month'] == item['month']), 0)
            performance_trends.append({
                'month': month_key,
                'revenue': float(item['revenue']),
                'orders': item['orders'],
                'customers': customers_count
            })

        # If no data, provide sample data
        if not performance_trends:
            performance_trends = [
                {'month': 'Jan', 'revenue': 30000, 'orders': 20, 'customers': 10},
                {'month': 'Feb', 'revenue': 40000, 'orders': 29, 'customers': 15},
                {'month': 'Mar', 'revenue': 35000, 'orders': 37, 'customers': 20},
                {'month': 'Apr', 'revenue': 50000, 'orders': 36, 'customers': 25},
                {'month': 'May', 'revenue': 49000, 'orders': 44, 'customers': 30},
                {'month': 'Jun', 'revenue': 60000, 'orders': 45, 'customers': 35},
                {'month': 'Jul', 'revenue': 70000, 'orders': 50, 'customers': 40}
            ]

        return Response({
            'total_revenue': float(total_revenue),
            'total_profit': float(total_profit),
            'monthly_revenue': monthly_revenue_data,
            'order_status_trends': status_trends,
            'customer_segments': customer_segments,
            'performance_trends': performance_trends,
        })

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def employees(self, request):
        employees = User.objects.filter(role='Employee')
        serializer = self.get_serializer(employees, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            if 'password' in request.data and request.data['password']:
                user.set_password(request.data['password'])
                user.save()
            return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if 'password' in request.data:
            user.set_password(request.data['password'])
            user.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.action == 'list':
            return Customer.objects.annotate(
                total_order_value=models.Sum('order__total_amount')
            ).distinct()
        return Customer.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        customer = self.get_object()

        # Get call logs for this customer
        call_logs = CallLog.objects.filter(customer=customer).select_related('employee').order_by('-date')

        # Get orders for this customer
        orders = Order.objects.filter(customer=customer).select_related('agent').order_by('-order_date')

        # Calculate summary statistics
        total_calls = call_logs.count()
        total_orders = orders.count()
        total_order_value = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_paid = orders.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
        total_pending = total_order_value - total_paid
        unique_employees = call_logs.values('employee').distinct().count()

        # Serialize data
        customer_data = CustomerSerializer(customer).data
        call_logs_data = CallLogSerializer(call_logs, many=True).data

        # Add agent name and items to orders
        orders_data = []
        for order in orders:
            order_items = []
            for item in order.items.all():
                order_items.append({
                    'product_title': item.product.title,
                    'product_sku': item.product.sku,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'gst_rate': float(item.gst_rate),
                    'total_price': float(item.total_price),
                })

            order_data = {
                'id': order.id,
                'order_id': order.order_id,
                'order_date': order.order_date,
                'agent': order.agent.username if order.agent else 'Unknown',
                'total_amount': float(order.total_amount),
                'paid_amount': float(order.paid_amount),
                'status': order.status,
                'payment_status': order.payment_status,
                'items': order_items,
            }
            orders_data.append(order_data)

        return Response({
            'customer': customer_data,
            'summary': {
                'total_calls': total_calls,
                'total_orders': total_orders,
                'total_order_value': float(total_order_value),
                'total_paid': float(total_paid),
                'total_pending': float(total_pending),
                'unique_employees': unique_employees,
            },
            'call_logs': call_logs_data,
            'orders': orders_data,
        })

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        # Auto-assign agent if not provided
        if not data.get('agent'):
            customer_id = data.get('customer')
            if customer_id:
                try:
                    customer = Customer.objects.get(id=customer_id)
                    if customer.agent:
                        data['agent'] = customer.agent.id
                    else:
                        # Auto-assign to admin if no agent found
                        admin_user = User.objects.filter(role='Admin').first()
                        if admin_user:
                            data['agent'] = admin_user.id
                except Customer.DoesNotExist:
                    # If customer doesn't exist, still assign to admin
                    admin_user = User.objects.filter(role='Admin').first()
                    if admin_user:
                        data['agent'] = admin_user.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class CustomerAssumptionViewSet(viewsets.ModelViewSet):
    queryset = CustomerAssumption.objects.filter(is_active=True)
    serializer_class = CustomerAssumptionSerializer
    permission_classes = [IsAuthenticated]

class CustomerAssumption2ViewSet(viewsets.ModelViewSet):
    queryset = CustomerAssumption2.objects.filter(is_active=True)
    serializer_class = CustomerAssumption2Serializer
    permission_classes = [IsAuthenticated]

class CustomerAssumption3ViewSet(viewsets.ModelViewSet):
    queryset = CustomerAssumption3.objects.filter(is_active=True)
    serializer_class = CustomerAssumption3Serializer
    permission_classes = [IsAuthenticated]

class CallLogViewSet(viewsets.ModelViewSet):
    queryset = CallLog.objects.select_related('order', 'employee', 'customer', 'lead', 'assumption')
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Check if there's an order_id provided
        order_id = self.request.data.get('order_id')
        if order_id:
            try:
                order = Order.objects.get(order_id=order_id)
                serializer.save(employee=self.request.user, order=order)
            except Order.DoesNotExist:
                serializer.save(employee=self.request.user)
        else:
            serializer.save(employee=self.request.user)

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        phone = request.data.get('phone')
        if phone and Customer.objects.filter(phone=phone).exists():
            return Response({'error': 'Phone number already exists as a customer'}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def convert_to_customer(self, request, pk=None):
        lead = self.get_object()

        # Check if phone already exists as customer
        if Customer.objects.filter(phone=lead.phone).exists():
            return Response({'error': 'Phone number already exists as a customer'}, status=status.HTTP_400_BAD_REQUEST)

        # Create customer from lead data
        customer_data = {
            'name': lead.name or 'Unknown',
            'phone': lead.phone,
            'email': lead.email,
            'pincode': '000000',  # Default pincode, can be updated later
            'address': 'Address to be updated',  # Default address
            'agent': lead.agent
        }

        customer_serializer = CustomerSerializer(data=customer_data)
        if customer_serializer.is_valid():
            customer = customer_serializer.save()

            # Update lead status to Converted
            lead.status = 'Converted'
            lead.save()

            return Response({
                'message': 'Lead converted to customer successfully',
                'customer': customer_serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(customer_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class GSTRateViewSet(viewsets.ModelViewSet):
    queryset = GSTRate.objects.filter(is_active=True)
    serializer_class = GSTRateSerializer
    permission_classes = [IsAuthenticated]

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        role = request.data.get('role', 'employee')  # Default to employee

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, password=password, email=email, role=role)
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
