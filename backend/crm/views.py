from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Customer, Product, Order, CallLog
from .serializers import UserSerializer, CustomerSerializer, ProductSerializer, OrderSerializer, CallLogSerializer

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, ExpressionWrapper, DecimalField, Sum

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_revenue = Order.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        profit_expr = ExpressionWrapper(F('total_amount') - F('paid_amount'), output_field=DecimalField())
        total_profit = Order.objects.aggregate(total=Sum(profit_expr))['total'] or 0
        return Response({
            'total_revenue': float(total_revenue),
            'total_profit': float(total_profit),
        })

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

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

class CallLogViewSet(viewsets.ModelViewSet):
    queryset = CallLog.objects.select_related('order', 'employee', 'customer')
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
