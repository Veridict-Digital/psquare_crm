
# crm/views.py - Complete file

from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from .models import BrandCategory1, Category, Flavour, Residual
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
import pandas as pd
import io
from django.core.files.base import ContentFile
from django.db import models
from django.utils import timezone
from .models import User, Customer, Product, Order, CallLog, CustomerAssumption, CustomerAssumption2, CustomerAssumption3, Lead, GSTRate, Category, ProductCombination, CombinationItem, CombinationReward, Phone, OrganizationType, CustomerType, Unit, Brand, BrandCategory, ProductPricing, OldOrderHistory
from .serializers import BrandCategory1Serializer, FlavourSerializer, OldOrderHistorySerializer, ResidualSerializer, UserSerializer, CustomerSerializer, ProductSerializer, OrderSerializer, CallLogSerializer, CustomerAssumptionSerializer, CustomerAssumption2Serializer, CustomerAssumption3Serializer, LeadSerializer, GSTRateSerializer, CategorySerializer, ProductCombinationSerializer, PhoneSerializer, OrganizationTypeSerializer, CustomerTypeSerializer, UnitSerializer, BrandSerializer, BrandCategorySerializer, ProductPricingSerializer

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, ExpressionWrapper, DecimalField, Sum, Count, Q
from datetime import timedelta
import datetime

# ========== PAGINATION CLASSES ==========
class CustomerPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100

class LeadPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100

class OrderPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        self.full_queryset = queryset
        return super().paginate_queryset(queryset, request, view)

    def get_paginated_response(self, data):
        from collections import OrderedDict
        from django.db.models import Sum
        total_sum = self.full_queryset.aggregate(total=Sum('total_amount'))['total'] or 0.0
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('total_amount', total_sum),
            ('results', data)
        ]))

class CallLogPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100

# ========== DASHBOARD VIEW ==========
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

# ========== USER VIEWSET ==========
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def employees(self, request):
        employees = User.objects.filter(role__in=['Employee', 'Telecaller'])
        serializer = self.get_serializer(employees, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            # Return current user info only
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

# ========== CUSTOMER VIEWSET ==========
# crm/views.py - Complete CustomerViewSet

class CustomerViewSet(viewsets.ModelViewSet):
        # ========== UNIQUE FIELD VALUE ENDPOINTS FOR FILTER DROPDOWNS ==========
    @action(detail=False, methods=['get'], url_path='unique_names')
    def unique_names(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(name__icontains=q)
        names = (
            qs.values_list('name', flat=True)
            .exclude(name__isnull=True)
            .exclude(name__exact='')
            .distinct()
            .order_by('name')[:20]
        )
        return Response(list(names))

    @action(detail=False, methods=['get'], url_path='unique_surnames')
    def unique_surnames(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(surname__icontains=q)
        surnames = (
            qs.values_list('surname', flat=True)
            .exclude(surname__isnull=True)
            .exclude(surname__exact='')
            .distinct()
            .order_by('surname')[:20]
        )
        return Response(list(surnames))

    @action(detail=False, methods=['get'], url_path='unique_company_names')
    def unique_company_names(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(company_name__icontains=q)
        company_names = (
            qs.values_list('company_name', flat=True)
            .exclude(company_name__isnull=True)
            .exclude(company_name__exact='')
            .distinct()
            .order_by('company_name')[:20]
        )
        return Response(list(company_names))

    @action(detail=False, methods=['get'], url_path='unique_areas')
    def unique_areas(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(area__icontains=q)
        areas = (
            qs.values_list('area', flat=True)
            .exclude(area__isnull=True)
            .exclude(area__exact='')
            .distinct()
            .order_by('area')[:20]
        )
        return Response(list(areas))

    @action(detail=False, methods=['get'], url_path='unique_cities')
    def unique_cities(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(city__icontains=q)
        cities = (
            qs.values_list('city', flat=True)
            .exclude(city__isnull=True)
            .exclude(city__exact='')
            .distinct()
            .order_by('city')[:20]
        )
        return Response(list(cities))

    @action(detail=False, methods=['get'], url_path='unique_districts')
    def unique_districts(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(district__icontains=q)
        districts = (
            qs.values_list('district', flat=True)
            .exclude(district__isnull=True)
            .exclude(district__exact='')
            .distinct()
            .order_by('district')[:20]
        )
        return Response(list(districts))

    @action(detail=False, methods=['get'], url_path='unique_tahsils')
    def unique_tahsils(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(tahsil__icontains=q)
        tahsils = (
            qs.values_list('tahsil', flat=True)
            .exclude(tahsil__isnull=True)
            .exclude(tahsil__exact='')
            .distinct()
            .order_by('tahsil')[:20]
        )
        return Response(list(tahsils))

    @action(detail=False, methods=['get'], url_path='unique_states')
    def unique_states(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(state__icontains=q)
        states = (
            qs.values_list('state', flat=True)
            .exclude(state__isnull=True)
            .exclude(state__exact='')
            .distinct()
            .order_by('state')[:20]
        )
        return Response(list(states))

    @action(detail=False, methods=['get'], url_path='unique_pincodes')
    def unique_pincodes(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(pincode__icontains=q)
        pincodes = (
            qs.values_list('pincode', flat=True)
            .exclude(pincode__isnull=True)
            .exclude(pincode__exact='')
            .distinct()
            .order_by('pincode')[:20]
        )
        return Response(list(pincodes))

    @action(detail=False, methods=['get'], url_path='unique_landmarks')
    def unique_landmarks(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(landmark__icontains=q)
        landmarks = (
            qs.values_list('landmark', flat=True)
            .exclude(landmark__isnull=True)
            .exclude(landmark__exact='')
            .distinct()
            .order_by('landmark')[:20]
        )
        return Response(list(landmarks))

    @action(detail=False, methods=['get'], url_path='unique_house_flat_nos')
    def unique_house_flat_nos(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(house_flat_no__icontains=q)
        house_flat_nos = (
            qs.values_list('house_flat_no', flat=True)
            .exclude(house_flat_no__isnull=True)
            .exclude(house_flat_no__exact='')
            .distinct()
            .order_by('house_flat_no')[:20]
        )
        return Response(list(house_flat_nos))

    @action(detail=False, methods=['get'], url_path='unique_wing_lanes')
    def unique_wing_lanes(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(wing_lane__icontains=q)
        wing_lanes = (
            qs.values_list('wing_lane', flat=True)
            .exclude(wing_lane__isnull=True)
            .exclude(wing_lane__exact='')
            .distinct()
            .order_by('wing_lane')[:20]
        )
        return Response(list(wing_lanes))

    @action(detail=False, methods=['get'], url_path='unique_society_colonies')
    def unique_society_colonies(self, request):
        q = request.query_params.get('q', '').strip()
        qs = Customer.objects.all()
        if q:
            qs = qs.filter(society_colony__icontains=q)
        society_colonies = (
            qs.values_list('society_colony', flat=True)
            .exclude(society_colony__isnull=True)
            .exclude(society_colony__exact='')
            .distinct()
            .order_by('society_colony')[:20]
        )
        return Response(list(society_colonies))

    @action(detail=False, methods=['get'], url_path='unique_phones')
    def unique_phones(self, request):
        q = request.query_params.get('q', '').strip()
        import re
        q_digits = re.sub(r'\D', '', q)
        
        qs = Customer.objects.all()
        user = request.user
        if user.role != 'Admin':
            qs = qs.filter(agent=user)
            
        # Get matching customer phone numbers
        phone_qs = qs
        if q_digits:
            phone_qs = phone_qs.filter(phone__contains=q_digits)
        elif q:
            phone_qs = phone_qs.filter(phone__contains=q)
            
        customer_phones = (
            phone_qs.values_list('phone', flat=True)
            .exclude(phone__isnull=True)
            .exclude(phone__exact='')
            .distinct()
        )
        
        # Get matching related Phone model numbers
        other_phones_qs = Phone.objects.filter(customer__in=qs)
        if q_digits:
            other_phones_qs = other_phones_qs.filter(phone__contains=q_digits)
        elif q:
            other_phones_qs = other_phones_qs.filter(phone__contains=q)
            
        other_phones = (
            other_phones_qs.values_list('phone', flat=True)
            .exclude(phone__isnull=True)
            .exclude(phone__exact='')
            .distinct()
        )
        
        # Combine unique values
        all_phones = list(set(list(customer_phones) + list(other_phones)))
        all_phones.sort()
        return Response(all_phones[:20])
        
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomerPagination

    def get_queryset(self):
        user = self.request.user
        queryset = Customer.objects.all()
        
        # ========== ROLE-BASED FILTERING (CRITICAL) ==========
        if user.role == 'Admin':
            # Admin sees ALL customers
            queryset = Customer.objects.all()
        else:
            # Telecaller/Employee sees ONLY customers assigned to them
            queryset = Customer.objects.filter(agent=user)
        
        # ========== OPTIMIZE QUERYSET ==========
        queryset = queryset.select_related('company_type', 'customer_type', 'agent')
        queryset = queryset.prefetch_related('phones')
        
        # ========== APPLY FILTERS FOR LIST AND EXPORT ==========
        if self.action in ['list', 'export_excel']:
            queryset = queryset.annotate(total_order_value=models.Sum('order__total_amount'))

            # Get filter parameters
            date_from = self.request.query_params.get('date_from')
            date_to = self.request.query_params.get('date_to')
            contact_type = self.request.query_params.get('contact_type')
            phone = self.request.query_params.get('phone')
            phone_search = self.request.query_params.get('search_phone')
            name_search = self.request.query_params.get('search_name')
            surname_search = self.request.query_params.get('search_surname')  # NEW
            agent = self.request.query_params.get('agent')
            address = self.request.query_params.get('address')
            organization_name = self.request.query_params.get('organization_name')
            organization_type = self.request.query_params.get('organization_type')
            customer_type = self.request.query_params.get('customer_type')
            telecaller = self.request.query_params.get('telecaller')
            time = self.request.query_params.get('time')
            search = self.request.query_params.get('search')
            has_appointment = self.request.query_params.get('has_appointment')
            gstin_no = self.request.query_params.get('gstin_no')
            
            # NEW: Individual address field filters
            house_flat_no = self.request.query_params.get('house_flat_no')
            wing_lane = self.request.query_params.get('wing_lane')
            society_colony = self.request.query_params.get('society_colony')
            landmark = self.request.query_params.get('landmark')
            area = self.request.query_params.get('area')
            city = self.request.query_params.get('city')
            district = self.request.query_params.get('district')
            tahsil = self.request.query_params.get('tahsil')
            state = self.request.query_params.get('state')
            pincode = self.request.query_params.get('pincode')

            # ========== LEADS VS APPOINTMENT TOGGLE (PRESERVED) ==========
            if has_appointment == 'true':
                queryset = queryset.filter(appointment_date__isnull=False)
            elif has_appointment == 'false':
                queryset = queryset.filter(appointment_date__isnull=True)

            # ========== APPLY ALL OTHER FILTERS ==========
            if date_from:
                queryset = queryset.filter(
                    models.Q(appointment_date__gte=date_from) |
                    (models.Q(appointment_date__isnull=True) & models.Q(created_at__gte=date_from))
                )
            
            if date_to:
                queryset = queryset.filter(
                    models.Q(appointment_date__lte=date_to) |
                    (models.Q(appointment_date__isnull=True) & models.Q(created_at__lte=date_to))
                )
            
            if contact_type:
                queryset = queryset.filter(contact_type=contact_type)
            
            if phone:
                queryset = queryset.filter(
                    models.Q(phone__icontains=phone) |
                    models.Q(phones__phone__icontains=phone)
                )
            
            if phone_search:
                queryset = queryset.filter(
                    models.Q(phone__icontains=phone_search) |
                    models.Q(phones__phone__icontains=phone_search)
                )
            
            if gstin_no:
                queryset = queryset.filter(gstin_no__iexact=gstin_no)
            
            # UPDATED: Separate name and surname search
            if name_search:
                queryset = queryset.filter(name__icontains=name_search)
            
            if surname_search:
                queryset = queryset.filter(surname__icontains=surname_search)
            
            if agent:
                queryset = queryset.filter(agent=int(agent))
            
            # NEW: Individual address field filters (more specific than generic address)
            if house_flat_no:
                queryset = queryset.filter(house_flat_no__icontains=house_flat_no)
            
            if wing_lane:
                queryset = queryset.filter(wing_lane__icontains=wing_lane)
            
            if society_colony:
                queryset = queryset.filter(society_colony__icontains=society_colony)
            
            if landmark:
                queryset = queryset.filter(landmark__icontains=landmark)
            
            if area:
                queryset = queryset.filter(area__icontains=area)
            
            if city:
                queryset = queryset.filter(city__icontains=city)
            
            if district:
                queryset = queryset.filter(district__icontains=district)
            
            if tahsil:
                queryset = queryset.filter(tahsil__icontains=tahsil)
            
            if state:
                queryset = queryset.filter(state__icontains=state)
            
            if pincode:
                queryset = queryset.filter(pincode__icontains=pincode)
            
            # Keep the generic address filter for backward compatibility
            if address:
                queryset = queryset.filter(
                    models.Q(house_flat_no__icontains=address) |
                    models.Q(wing_lane__icontains=address) |
                    models.Q(society_colony__icontains=address) |
                    models.Q(landmark__icontains=address) |
                    models.Q(area__icontains=address) |
                    models.Q(state__icontains=address) |
                    models.Q(district__icontains=address) |
                    models.Q(tahsil__icontains=address) |
                    models.Q(city__icontains=address) |
                    models.Q(address__icontains=address)
                )
            
            if organization_name:
                queryset = queryset.filter(company_name__icontains=organization_name)
            
            if organization_type:
                queryset = queryset.filter(company_type__name__icontains=organization_type)
            
            if customer_type:
                queryset = queryset.filter(customer_type__name__icontains=customer_type)
            
            if telecaller:
                queryset = queryset.filter(agent__username__icontains=telecaller, agent__role='Telecaller')
            
            if time:
                queryset = queryset.filter(appointment_time__icontains=time)
            
            if search:
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(surname__icontains=search) |
                    Q(phone__icontains=search) |
                    Q(company_name__icontains=search) |
                    Q(company_type__name__icontains=search) |
                    Q(pincode__icontains=search) |
                    Q(house_flat_no__icontains=search) |
                    Q(wing_lane__icontains=search) |
                    Q(society_colony__icontains=search) |
                    Q(landmark__icontains=search) |
                    Q(area__icontains=search) |
                    Q(state__icontains=search) |
                    Q(district__icontains=search) |
                    Q(tahsil__icontains=search) |
                    Q(city__icontains=search) |
                    Q(email__icontains=search) |
                    Q(phones__phone__icontains=search)
                ).distinct()

        # ========== ORDERING (APPOINTMENT DATE PRIORITY) ==========
            from django.db.models import Case, When, Value, IntegerField, Q, F
            from django.db.models.functions import Coalesce

            queryset = queryset.annotate(
                effective_date=Coalesce('appointment_date', 'created_at', output_field=models.DateTimeField())
            ).order_by(
                'effective_date',  # 1. Sort by date (appointment_date or created_at)
                Case(
                    When(Q(appointment_time__isnull=True) | Q(appointment_time=''), then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                ),  # 2. Non-empty times come first, empty times come last
                'appointment_time',  # 3. Sort by appointment time (alphabetically)
                'created_at'  # 4. NEW: Oldest created_at first, newest at bottom
            )
        
        return queryset

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # ========== ADD ROLE-BASED UPDATE PROTECTION ==========
        user = request.user
        if user.role != 'Admin' and instance.agent != user:
            return Response(
                {'error': 'You can only update customers assigned to you'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # ========== RESET APPOINTMENT TIME WHEN DATE CHANGES ==========
        # Get old appointment date
        old_appointment_date = instance.appointment_date
        # Get new appointment date from request (if provided)
        new_appointment_date = request.data.get('appointment_date')
        
        # Check if appointment_date is being updated and has changed
        if new_appointment_date is not None:
            # Convert to string for comparison (handle None vs date object)
            old_date_str = str(old_appointment_date) if old_appointment_date else None
            new_date_str = str(new_appointment_date) if new_appointment_date else None
            
            if old_date_str != new_date_str:
                # Appointment date changed, reset appointment_time
                # Create a mutable copy of request data
                mutable_data = request.data.copy()
                mutable_data['appointment_time'] = None
                # Update the request data
                request._full_data = mutable_data
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        # ========== ADD ROLE-BASED DELETE PROTECTION ==========
        user = request.user
        instance = self.get_object()
        
        if user.role != 'Admin':
            return Response(
                {'error': 'Only admins can delete customers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        customer = self.get_object()
        
        # ========== ADD ROLE-BASED ACCESS PROTECTION ==========
        user = request.user
        if user.role != 'Admin' and customer.agent != user:
            return Response(
                {'error': 'You can only view customers assigned to you'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get all phone numbers from Phone model, include contact_person
        from collections import OrderedDict
        all_phones_dict = OrderedDict()
        for phone_obj in customer.phones.all():
            if phone_obj.phone not in all_phones_dict:
                all_phones_dict[phone_obj.phone] = {
                    'phone': phone_obj.phone,
                    'id': phone_obj.id,
                    'is_primary': phone_obj.is_primary,
                    'contact_person': phone_obj.contact_person,
                }
        all_phones = list(all_phones_dict.values())

        # Get call logs for this customer
        call_logs = CallLog.objects.filter(customer=customer).select_related('employee').prefetch_related('assumption', 'assumption2', 'assumption3').order_by('-date')

        old_order_histories = OldOrderHistory.objects.filter(customer=customer).order_by('-date')
        
        # For non-admin, only show their own call logs
        if user.role != 'Admin':
            call_logs = call_logs.filter(employee=user)

        # Get orders for this customer
        orders = Order.objects.filter(customer=customer).select_related('agent').prefetch_related('items__product').order_by('-id')

        # Calculate summary statistics
        total_calls = call_logs.count()
        total_orders = orders.count()
        total_order_value = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        total_paid = orders.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
        total_pending = total_order_value - total_paid
        unique_employees = call_logs.values('employee').distinct().count()

        # Serialize data
        customer_data = CustomerSerializer(customer).data
        customer_data['all_phones'] = all_phones
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
            'old_order_histories': OldOrderHistorySerializer(old_order_histories, many=True).data,
        })

    @action(detail=True, methods=['post'])
    def add_phone(self, request, pk=None):
        customer = self.get_object()
        
        # ========== ADD ROLE-BASED ACCESS PROTECTION ==========
        user = request.user
        if user.role != 'Admin' and customer.agent != user:
            return Response(
                {'error': 'You can only modify customers assigned to you'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        phone_number = request.data.get('phone')

        if not phone_number:
            return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)

        if Phone.objects.filter(phone=phone_number).exists():
            return Response({'error': 'Phone number already exists'}, status=status.HTTP_400_BAD_REQUEST)

        phone = Phone.objects.create(customer=customer, phone=phone_number, is_primary=False)

        serializer = PhoneSerializer(phone)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def set_primary_phone(self, request, pk=None):
        customer = self.get_object()
        
        # ========== ADD ROLE-BASED ACCESS PROTECTION ==========
        user = request.user
        if user.role != 'Admin' and customer.agent != user:
            return Response(
                {'error': 'You can only modify customers assigned to you'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        phone_id = request.data.get('phone_id')

        if not phone_id:
            return Response({'error': 'Phone ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            phone = Phone.objects.get(id=phone_id, customer=customer)
        except Phone.DoesNotExist:
            return Response({'error': 'Phone not found for this customer'}, status=status.HTTP_404_NOT_FOUND)

        phone.is_primary = True
        phone.save()

        customer.phone = phone.phone
        customer.save()

        serializer = PhoneSerializer(phone)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'])
    def delete_phone(self, request, pk=None):
        customer = self.get_object()
        
        # ========== ADD ROLE-BASED ACCESS PROTECTION ==========
        user = request.user
        if user.role != 'Admin' and customer.agent != user:
            return Response(
                {'error': 'You can only modify customers assigned to you'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        phone_id = request.data.get('phone_id')

        if not phone_id:
            return Response({'error': 'Phone ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            phone = Phone.objects.get(id=phone_id, customer=customer)
        except Phone.DoesNotExist:
            return Response({'error': 'Phone not found for this customer'}, status=status.HTTP_404_NOT_FOUND)

        if phone.is_primary and customer.phones.count() > 1:
            return Response({'error': 'Cannot delete primary phone. Set another phone as primary first.'}, status=status.HTTP_400_BAD_REQUEST)

        phone.delete()

        if phone.is_primary and customer.phones.exists():
            new_primary = customer.phones.first()
            new_primary.is_primary = True
            new_primary.save()
            customer.phone = new_primary.phone
            customer.save()

        return Response({'message': 'Phone deleted successfully'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        # ========== ONLY ADMINS CAN BULK ASSIGN ==========
        user = request.user
        if user.role != 'Admin':
            return Response(
                {'error': 'Only admins can bulk assign customers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        customer_ids = request.data.get('customer_ids', [])
        agent_id = request.data.get('agent_id')

        if not customer_ids:
            return Response({'error': 'Customer IDs are required'}, status=status.HTTP_400_BAD_REQUEST)

        if not agent_id:
            return Response({'error': 'Agent ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            agent = User.objects.get(id=agent_id, role__in=['Employee', 'Telecaller'])
        except User.DoesNotExist:
            return Response({'error': 'Invalid agent ID'}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = Customer.objects.filter(id__in=customer_ids).update(agent=agent)

        return Response({
            'message': f'Successfully assigned {updated_count} customers to {agent.username}',
            'updated_count': updated_count
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        # ========== ROLE-BASED EXPORT ==========
        # The get_queryset() method already applies role-based filtering
        queryset = self.get_queryset()
        queryset = self.filter_queryset(queryset)

        # Annotate outstanding_amt to avoid database queries inside the loop
        from django.db.models import Sum, Q, F, DecimalField
        from django.db.models.functions import Coalesce
        
        queryset = queryset.annotate(
            outstanding_amt=Coalesce(
                Sum(
                    F('order__total_amount') - F('order__paid_amount'),
                    filter=Q(order__payment_status__in=['Partial', 'Credit'])
                ),
                0,
                output_field=DecimalField()
            )
        )

        customers_data = []
        for customer in queryset:
            try:
                # Retrieve all unique phone numbers for this customer (prefetched)
                all_phones = []
                # Sort in memory to avoid N+1 queries (Django .order_by on prefetched queryset bypasses prefetch cache)
                phones_list = sorted(customer.phones.all(), key=lambda p: (not p.is_primary, p.id))
                for p in phones_list:
                    if p.phone and p.phone not in all_phones:
                        all_phones.append(p.phone)
                if customer.phone and customer.phone not in all_phones:
                    all_phones.insert(0, customer.phone)
                
                phone_value = ", ".join(all_phones)

                customer_dict = {
                    'ID': customer.id,
                    'Name': customer.name or '',
                    'Surname': customer.surname or '',
                    'Phone': phone_value,
                    'Email': customer.email or '',
                    'Company Name': customer.company_name or '',
                    'Company Type': customer.company_type.name if customer.company_type else '',
                    'Customer Type': customer.customer_type.name if customer.customer_type else '',
                    'GSTIN No': customer.gstin_no or '',
                    'Contact Type': customer.contact_type or '',
                    'Pincode': customer.pincode or '',
                    'House/Flat No': customer.house_flat_no or '',
                    'Wing/Lane': customer.wing_lane or '',
                    'Society/Colony': customer.society_colony or '',
                    'Landmark': customer.landmark or '',
                    'Area': customer.area or '',
                    'City': customer.city or '',
                    'District': customer.district or '',
                    'State': customer.state or '',
                    'Tahsil': customer.tahsil or '',
                    'Telecaller': customer.agent.username if customer.agent else '',
                    'Total Order Value': float(getattr(customer, 'total_order_value', 0) or 0),
                    'Outstanding Amount': float(getattr(customer, 'outstanding_amt', 0) or 0),
                    'Created At': customer.created_at.strftime('%Y-%m-%d %H:%M:%S') if customer.created_at else '',
                    'Appointment Date': customer.appointment_date.strftime('%Y-%m-%d') if customer.appointment_date else '',
                    'Appointment Time': str(customer.appointment_time) if customer.appointment_time else '',
                }
                customers_data.append(customer_dict)
            except Exception as e:
                print(f"Error processing customer {customer.id}: {str(e)}")
                continue

        return Response({
            'customers': customers_data,
            'total_count': len(customers_data)
        })

# ========== PRODUCT VIEWSET ==========
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related(
        'category', 'category1', 'category2', 'category3', 'category4',
        'gst_rate', 'brand', 'brand_category', 'flavour', 'residual',
        'brand_category1', 'packing_weight_unit'
    ).prefetch_related('pricings').all().order_by('-id')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @action(detail=False, methods=['post'], url_path='bulk-import', parser_classes=[MultiPartParser, FormParser])
    def bulk_import(self, request):
        """Bulk import products from Excel/CSV file"""
        import pandas as pd
        from django.db import transaction
        
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import logging
            logger = logging.getLogger(__name__)
            
            # Read file with robust encoding
            if file.name.endswith('.csv'):
                try:
                    df = pd.read_csv(file, encoding='utf-8-sig')
                except UnicodeDecodeError:
                    file.seek(0)
                    df = pd.read_csv(file, encoding='latin1')
            elif file.name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file)
            else:
                return Response({'error': 'Unsupported file type. Use CSV or Excel.'}, status=status.HTTP_400_BAD_REQUEST)

            logger.info(f"Bulk import file: {file.name}, shape: {df.shape}")
            logger.info(f"Columns found: {list(df.columns)}")
            logger.info(f"First 3 rows:\n{df.head(3).to_dict()}")
            
            if df.empty:
                return Response({'error': 'File is empty'}, status=status.HTTP_400_BAD_REQUEST)

            # Column mapping
            column_map = {
                'sku': 'sku',
                'title': ['name', 'product_name', 'title'],
                'stock_qty': ['stock', 'stock_qty', 'quantity'],
                'price': 'price',
                'purchase_price': ['purchase_price', 'cost', 'purchase'],
                'mrp': 'mrp',
                'b2c_price': 'b2c_price',
                'b2b_price': 'b2b_price',
                'category': 'category',
                'category1': 'category1',
                'category2': 'category2',
                'category3': 'category3',
                'category4': 'category4',
                'unit': 'unit',
                'hsn': 'hsn',
                'product_weight': ['weight', 'product_weight'],
                'gst_rate': 'gst_rate',
                'description': 'description',
                'brand': 'brand',
                'volume': 'volume',
                'brand_name': 'brand_name',
                'brand_category': 'brand_category',
                'flavour': 'flavour',
                'residual': 'residual'
            }

            products_data = []
            errors = []
            
            # Log expected columns
            logger.info(f"Expected columns: sku, title, price, stock_qty, etc.")

            
            for idx, row in df.iterrows():
                product_data = {}
                row_num = idx + 2
                row_dict = row.to_dict()
                logger.info(f"Processing row {row_num}: {row_dict}")
                
                try:
                    # Map SKU (required) - case insensitive
                    sku = row.get('sku') or row.get('SKU') or row.get('Sku')
                    if pd.isna(sku) or not str(sku).strip():
                        errors.append({'row': row_num, 'error': 'SKU is required (check column: sku/SKU)'})
                        logger.warning(f"Row {row_num} missing SKU")
                        continue
                    product_data['sku'] = str(sku).strip()
                    logger.info(f"Row {row_num} SKU: {product_data['sku']}")
                    
                    # Map Title (required) - case insensitive
                    title = row.get('title') or row.get('Title') or row.get('name') or row.get('product_name') or row.get('product_name')
                    if pd.isna(title) or not str(title).strip():
                        errors.append({'row': row_num, 'error': 'Title is required (check column: title/Title/name)'})
                        logger.warning(f"Row {row_num} missing Title")
                        continue
                    product_data['title'] = str(title).strip()
                    logger.info(f"Row {row_num} Title: {product_data['title']}")
                    
                    # Stock
                    stock_value = row.get('stock_qty') or row.get('stock') or row.get('quantity') or 0
                    try:
                        product_data['stock_qty'] = int(float(stock_value)) if pd.notna(stock_value) else 0
                    except:
                        product_data['stock_qty'] = 0
                    
                    # Price (required) - case insensitive
                    price = row.get('price') or row.get('Price')
                    if pd.isna(price):
                        errors.append({'row': row_num, 'error': 'Price is required (check column: price/Price)'})
                        logger.warning(f"Row {row_num} missing Price")
                        continue
                    try:
                        product_data['price'] = float(price)
                        logger.info(f"Row {row_num} Price: {product_data['price']}")
                    except (ValueError, TypeError):
                        errors.append({'row': row_num, 'error': f'Invalid price format: "{price}"'})
                        logger.warning(f"Row {row_num} invalid price: {price}")
                        continue
                    
                    # Optional price fields
                    for price_key in ['purchase_price', 'mrp', 'b2c_price', 'b2b_price']:
                        val = row.get(price_key)
                        if pd.notna(val):
                            try:
                                product_data[price_key] = float(val)
                            except:
                                pass
                    
                    # Map other fields
                    for field in ['description', 'brand', 'volume', 'hsn']:
                        val = row.get(field)
                        if pd.notna(val):
                            product_data[field] = str(val) if val else None
                    
                    # New fields mapping
                    new_fields = ['brand_name', 'brand_category', 'flavour', 'residual']
                    for field in new_fields:
                        val = row.get(field)
                        if pd.notna(val):
                            product_data[field] = str(val).strip()
                            logger.info(f"Row {row_num} {field}: {product_data[field]}")

                    
                    # Categories - log attempts, continue if not found (don't block import)

                    category_fields = ['category', 'category1', 'category2', 'category3', 'category4']
                    for field in category_fields:
                        val = row.get(field) or row.get(field.capitalize())
                        if pd.notna(val) and str(val).strip():
                            cat_val = str(val).strip()
                            try:
                                if cat_val.isdigit():
                                    cat_obj = Category.objects.filter(id=int(cat_val)).first()
                                else:
                                    cat_obj = Category.objects.filter(name__iexact=cat_val).first()
                                if cat_obj:
                                    product_data[field] = cat_obj
                                    logger.info(f"Row {row_num} {field}: {cat_obj.name} (ID:{cat_obj.id})")
                                else:
                                    logger.warning(f"Row {row_num} {field} '{cat_val}' not found in DB categories")
                                    errors.append({'row': row_num, 'error': f'{field} "{cat_val}" not found - set manually after import'})
                            except Exception as cat_error:
                                logger.error(f"Row {row_num} {field} error: {cat_error}")
                                product_data[field] = None
                        else:
                            product_data[field] = None
                    
                    # Unit lookup (mirroring category approach)
                    unit_val = row.get('unit') or row.get('Unit')
                    if pd.notna(unit_val) and str(unit_val).strip():
                        unit_name = str(unit_val).strip()
                        try:
                            unit_obj = Unit.objects.filter(name__iexact=unit_name).first()
                            if unit_obj:
                                product_data['unit'] = unit_obj.name
                                logger.info(f"Row {row_num} unit: {unit_obj.name}")
                            else:
                                logger.warning(f"Row {row_num} unit '{unit_name}' not found in DB units")
                                errors.append({'row': row_num, 'error': f'unit "{unit_name}" not found - set manually after import'})
                        except Exception as unit_error:
                            logger.error(f"Row {row_num} unit error: {unit_error}")
                    else:
                        product_data['unit'] = None
                    
                    # GST Rate lookup (mirroring category approach)
                    gst_val = row.get('gst_rate') or row.get('GST Rate') or row.get('gst') or row.get('Gst')
                    if pd.notna(gst_val) and str(gst_val).strip():
                        gst_str = str(gst_val).strip()
                        try:
                            gst_obj = None
                            if gst_str.replace('.', '').isdigit():
                                # Try as rate first (e.g. "18", "18.00")
                                gst_obj = GSTRate.objects.filter(rate__exact=float(gst_str)).first()
                            if not gst_obj:
                                # Then try as name
                                gst_obj = GSTRate.objects.filter(name__iexact=gst_str).first()
                            if gst_obj:
                                product_data['gst_rate'] = gst_obj
                                logger.info(f"Row {row_num} gst_rate: {gst_obj.name} ({gst_obj.rate}%)")
                            else:
                                logger.warning(f"Row {row_num} gst_rate '{gst_str}' not found in DB GST rates")
                                errors.append({'row': row_num, 'error': f'gst_rate "{gst_str}" not found - set manually after import'})
                        except Exception as gst_error:
                            logger.error(f"Row {row_num} gst_rate error: {gst_error}")
                    else:
                        product_data['gst_rate'] = None
                    
                    products_data.append(product_data)
                    logger.info(f"Row {row_num} prepared: {list(product_data.keys())}")

                    
                except Exception as e:
                    errors.append({'row': row_num, 'error': str(e)})
                    import traceback
                    traceback.print_exc()

            logger.info(f"Valid products found: {len(products_data)}, errors: {len(errors)}")
            if not products_data:
                debug_info = {
                    'file_name': file.name,
                    'shape': df.shape,
                    'columns': list(df.columns),
                    'sample_data': df.head(3).to_dict('records'),
                    'expected_columns': ['sku', 'title', 'price', 'stock_qty'],
                    'available_categories': list(Category.objects.filter(is_active=True).values_list('id', 'name'))
                }
                return Response({
                    'error': 'No valid products found in file',
                    'debug': debug_info,
                    'errors': errors[:10],
                    'hint': 'Check column names (case-sensitive), ensure sku/title/price exist, verify categories match DB'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create or update products
            created_count = 0
            updated_count = 0
            
            with transaction.atomic():
                for product_data in products_data:
                    sku = product_data.pop('sku')
                    
                    # Check if product exists
                    product, created = Product.objects.update_or_create(
                        sku=sku,
                        defaults=product_data
                    )
                    
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

            response_data = {
                'success': True,
                'created_count': created_count,
                'updated_count': updated_count,
                'total_processed': len(products_data),
                'error_count': len(errors),
                'errors': errors[:20] if errors else []
            }
            
            if errors:
                response_data['message'] = f'Imported {created_count} new products, updated {updated_count} products. {len(errors)} rows had errors.'
                return Response(response_data, status=status.HTTP_207_MULTI_STATUS)
            else:
                response_data['message'] = f'Successfully imported {created_count} new products and updated {updated_count} existing products.'
                return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Processing failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            


# Add to your views.py

class BrandViewSet(viewsets.ModelViewSet):
    """ViewSet for managing brands"""
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAuthenticated]


class BrandCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing brand categories"""
    queryset = BrandCategory.objects.all()
    serializer_class = BrandCategorySerializer
    permission_classes = [IsAuthenticated]

class FlavourViewSet(viewsets.ModelViewSet):
    """ViewSet for managing flavours"""
    queryset = Flavour.objects.filter(is_active=True)
    serializer_class = FlavourSerializer
    permission_classes = [IsAuthenticated]


class ResidualViewSet(viewsets.ModelViewSet):
    """ViewSet for managing residuals"""
    queryset = Residual.objects.filter(is_active=True)
    serializer_class = ResidualSerializer
    permission_classes = [IsAuthenticated]


class BrandCategory1ViewSet(viewsets.ModelViewSet):
    """ViewSet for managing brand category 1"""
    queryset = BrandCategory1.objects.filter(is_active=True)
    serializer_class = BrandCategory1Serializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = BrandCategory1.objects.filter(is_active=True)
        parent_id = self.request.query_params.get('parent_id')
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        else:
            queryset = queryset.filter(parent__isnull=True)
        return queryset


# ========== ORDER VIEWSET ==========
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('customer', 'agent').all().order_by('-id')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = OrderPagination

    def get_queryset(self):
        queryset = Order.objects.select_related('customer', 'agent').all().order_by('-id')
        # Get filter params
        agent = self.request.query_params.get('agent')
        status = self.request.query_params.get('status')
        payment_status = self.request.query_params.get('payment_status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        search = self.request.query_params.get('search')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        min_items = self.request.query_params.get('min_items')
        max_items = self.request.query_params.get('max_items')
        product_name = self.request.query_params.get('product_name')
        brand_name = self.request.query_params.get('brand_name')

        # Customer-specific filter params from CustomerList
        customer_phone = self.request.query_params.get('customer_phone')
        customer_name = self.request.query_params.get('customer_name')
        customer_surname = self.request.query_params.get('customer_surname')
        customer_org_name = self.request.query_params.get('customer_org_name')
        customer_org_type = self.request.query_params.get('customer_org_type')
        customer_customer_type = self.request.query_params.get('customer_customer_type')
        customer_telecaller = self.request.query_params.get('customer_telecaller')
        
        customer_house_flat_no = self.request.query_params.get('customer_house_flat_no')
        customer_wing_lane = self.request.query_params.get('customer_wing_lane')
        customer_society_colony = self.request.query_params.get('customer_society_colony')
        customer_landmark = self.request.query_params.get('customer_landmark')
        customer_area = self.request.query_params.get('customer_area')
        customer_city = self.request.query_params.get('customer_city')
        customer_district = self.request.query_params.get('customer_district')
        customer_tahsil = self.request.query_params.get('customer_tahsil')
        customer_state = self.request.query_params.get('customer_state')
        customer_pincode = self.request.query_params.get('customer_pincode')

        if agent:
            queryset = queryset.filter(agent__username=agent)
        if status:
            queryset = queryset.filter(status=status)
        if payment_status:
            queryset = queryset.filter(payment_status__iexact=payment_status)
        if date_from:
            queryset = queryset.filter(order_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(order_date__lte=date_to)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(order_id__icontains=search) |
                Q(customer__name__icontains=search)
            )
        if min_price:
            queryset = queryset.filter(total_amount__gte=min_price)
        if max_price:
            queryset = queryset.filter(total_amount__lte=max_price)
        if min_items or max_items:
            from django.db.models import Count
            queryset = queryset.annotate(items_count=Count('items'))
            if min_items:
                queryset = queryset.filter(items_count__gte=min_items)
            if max_items:
                queryset = queryset.filter(items_count__lte=max_items)
        if product_name:
            queryset = queryset.filter(items__product__title__icontains=product_name).distinct()
        if brand_name:
            queryset = queryset.filter(items__product__brand__name__icontains=brand_name).distinct()

        # Apply customer-specific filters
        if customer_phone:
            queryset = queryset.filter(customer__phone__icontains=customer_phone)
        if customer_name:
            queryset = queryset.filter(customer__name__icontains=customer_name)
        if customer_surname:
            queryset = queryset.filter(customer__surname__icontains=customer_surname)
        if customer_org_name:
            queryset = queryset.filter(customer__company_name__icontains=customer_org_name)
        if customer_org_type:
            queryset = queryset.filter(customer__company_type__name__icontains=customer_org_type)
        if customer_customer_type:
            queryset = queryset.filter(customer__customer_type__name__icontains=customer_customer_type)
        if customer_telecaller:
            queryset = queryset.filter(customer__agent__username=customer_telecaller)
            
        if customer_house_flat_no:
            queryset = queryset.filter(customer__house_flat_no__icontains=customer_house_flat_no)
        if customer_wing_lane:
            queryset = queryset.filter(customer__wing_lane__icontains=customer_wing_lane)
        if customer_society_colony:
            queryset = queryset.filter(customer__society_colony__icontains=customer_society_colony)
        if customer_landmark:
            queryset = queryset.filter(customer__landmark__icontains=customer_landmark)
        if customer_area:
            queryset = queryset.filter(customer__area__icontains=customer_area)
        if customer_city:
            queryset = queryset.filter(customer__city__icontains=customer_city)
        if customer_district:
            queryset = queryset.filter(customer__district__icontains=customer_district)
        if customer_tahsil:
            queryset = queryset.filter(customer__tahsil__icontains=customer_tahsil)
        if customer_state:
            queryset = queryset.filter(customer__state__icontains=customer_state)
        if customer_pincode:
            queryset = queryset.filter(customer__pincode__icontains=customer_pincode)

        return queryset.prefetch_related('items__product')


    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        return Response(serializer.data)

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
                        admin_user = User.objects.filter(role='Admin').first()
                        if admin_user:
                            data['agent'] = admin_user.id
                except Customer.DoesNotExist:
                    admin_user = User.objects.filter(role='Admin').first()
                    if admin_user:
                        data['agent'] = admin_user.id

        # Ensure delivery_address is passed as dict if structured fields are present
        delivery_fields = [
            'house_flat_no', 'wing_lane', 'society_colony', 'landmark', 'area', 'pincode',
            'state', 'district', 'tahsil', 'city'
        ]
        if any([data.get(f'delivery_{field}') for field in delivery_fields]):
            delivery_address_dict = {field: data.get(f'delivery_{field}', '') for field in delivery_fields}
            data['delivery_address'] = delivery_address_dict

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        queryset = self.get_queryset()
        queryset = self.filter_queryset(queryset)
        
        # Prefetch customer and items for performance
        queryset = queryset.select_related('customer', 'agent').prefetch_related('items__product')
        
        orders_data = []
        for order in queryset:
            # Address formatting
            delivery_address = order.get_full_delivery_address()
            if not delivery_address:
                delivery_address = order.delivery_address or ''

            total_amount = float(order.total_amount)
            
            # Subtotal and GST bifurcation
            without_gst_total = 0.0
            customer_state = order.customer.state or ''
            is_maharashtra = 'maharashtra' in customer_state.lower() or not customer_state.strip()
            
            for item in order.items.all():
                if item.is_free or item.is_gift:
                    continue
                item_total = float(item.total_price)
                gst_rate = float(item.gst_rate)
                taxable_value = item_total / (1.0 + (gst_rate / 100.0))
                without_gst_total += taxable_value
            
            without_gst_total = round(without_gst_total, 2)
            total_gst = round(total_amount - without_gst_total, 2)
            
            if is_maharashtra:
                cgst_total = round(total_gst / 2.0, 2)
                sgst_total = round(total_gst / 2.0, 2)
                igst_total = 0.0
            else:
                cgst_total = 0.0
                sgst_total = 0.0
                igst_total = total_gst
                
            orders_data.append({
                'Order Date': order.order_date.strftime('%Y-%m-%d') if order.order_date else '',
                'Customer Name': f"{order.customer.name or ''} {order.customer.surname or ''}".strip(),
                'Organization Name': order.customer.company_name or '',
                'Contact Number': order.customer.phone or '',
                'Address': delivery_address,
                'Total Amount': total_amount,
                'Without GST Amount': without_gst_total,
                'CGST Amount': cgst_total,
                'SGST Amount': sgst_total,
                'IGST Amount': igst_total,
                'Total GST Amount': total_gst,
                'Status': order.get_status_display(),
                'Payment Status': order.get_payment_status_display()
            })
            
        return Response({
            'orders': orders_data,
            'total_count': len(orders_data)
        })

# ========== OLD ORDER HISTORY VIEWSETS ==========
class OldOrderHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = OldOrderHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = OldOrderHistory.objects.all()
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset.order_by('-date')

    def perform_create(self, serializer):
        customer_id = self.request.data.get('customer')
        if customer_id:
            try:
                customer = Customer.objects.get(id=customer_id)
                serializer.save(customer=customer)
            except Customer.DoesNotExist:
                raise serializers.ValidationError({'customer': 'Customer does not exist'})
        else:
            raise serializers.ValidationError({'customer': 'Customer is required'})

# ========== CUSTOMER ASSUMPTION VIEWSETS ==========
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

# ========== CALL LOG VIEWSET ==========
class CallLogViewSet(viewsets.ModelViewSet):
    queryset = CallLog.objects.select_related('order', 'employee', 'customer', 'lead')
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CallLogPagination

    def get_queryset(self):
        queryset = CallLog.objects.select_related('order', 'employee', 'customer', 'lead').all()
        
        # Get filter parameters from query params
        status = self.request.query_params.get('status')
        employee = self.request.query_params.get('employee')
        order_placed = self.request.query_params.get('order_placed')
        search = self.request.query_params.get('search')
        
        # Apply filters
        if status:
            queryset = queryset.filter(status=status)
        
        if employee:
            queryset = queryset.filter(employee__username=employee)
        
        if order_placed:
            if order_placed == 'Yes':
                queryset = queryset.filter(order__isnull=False)
            elif order_placed == 'No':
                queryset = queryset.filter(order__isnull=True)
        
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(customer__name__icontains=search) |
                Q(lead__name__icontains=search) |
                Q(call_id__icontains=search) |
                Q(note__icontains=search)
            )
        
        # Default ordering by date descending
        return queryset.order_by('-date', '-id')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get call log statistics for KPIs - returns counts from all records, not just paginated"""
        # Base queryset without pagination
        queryset = CallLog.objects.all()
        
        # Get filter parameters
        status = request.query_params.get('status')
        employee = request.query_params.get('employee')
        order_placed = request.query_params.get('order_placed')
        search = request.query_params.get('search')
        
        # Apply same filters as get_queryset
        if status:
            queryset = queryset.filter(status=status)
        if employee:
            queryset = queryset.filter(employee__username=employee)
        if order_placed:
            if order_placed == 'Yes':
                queryset = queryset.filter(order__isnull=False)
            elif order_placed == 'No':
                queryset = queryset.filter(order__isnull=True)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(customer__name__icontains=search) |
                Q(lead__name__icontains=search) |
                Q(call_id__icontains=search) |
                Q(note__icontains=search)
            )
        
        # Get total count
        total_calls = queryset.count()
        
        # Get completed calls
        completed_calls = queryset.filter(status='Completed').count()
        
        # Get pending calls
        pending_calls = queryset.filter(status='Pending').count()
        
        # Get orders placed
        orders_placed = queryset.filter(order__isnull=False).count()
        
        # Calculate conversion rate
        conversion_rate = round((orders_placed / total_calls * 100), 1) if total_calls > 0 else 0
        
        # Calculate average duration
        avg_duration_seconds = 0
        calls_with_duration = queryset.exclude(duration__isnull=True)
        if calls_with_duration.exists():
            total_seconds = sum(call.duration.total_seconds() for call in calls_with_duration if call.duration)
            count = calls_with_duration.count()
            avg_duration_seconds = total_seconds / count if count > 0 else 0
        
        avg_duration_formatted = int(avg_duration_seconds)
        
        return Response({
            'total_calls': total_calls,
            'completed_calls': completed_calls,
            'pending_calls': pending_calls,
            'orders_placed': orders_placed,
            'conversion_rate': conversion_rate,
            'avg_duration_seconds': avg_duration_formatted
        })

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

    @action(detail=False, methods=['post'])
    def save_info(self, request):
        from django.utils import timezone
        from rest_framework import serializers
        
        data = request.data.copy()
        data['employee'] = request.user.id
        
        # CRITICAL: Require customer ID
        customer_id = data.get('customer')
        
        if not customer_id:
            return Response(
                {'error': 'Customer ID is required. Cannot save call log without customer.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate customer exists
        try:
            customer = Customer.objects.get(id=customer_id)
            data['customer'] = customer.id
        except Customer.DoesNotExist:
            return Response(
                {'error': f'Customer with id {customer_id} does not exist'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove lead field
        data.pop('lead', None)
        
        # Set status
        if 'status' not in data or not data['status']:
            data['status'] = 'In Progress'
        data['saved_at'] = timezone.now()
        
        # Convert duration from seconds to timedelta
        if 'duration' in data:
            from datetime import timedelta
            data['duration'] = timedelta(seconds=int(data['duration']))
        
        # IMPORTANT: Check if this is an edit operation
        call_id = data.get('call_id')
        is_editing = data.get('is_editing', False)  # Frontend should send this flag
        
        existing_call_log = None
        
        # ONLY find existing if this is an edit operation
        if call_id and is_editing:
            try:
                existing_call_log = CallLog.objects.get(call_id=call_id)
                print(f"Editing existing call log: {call_id}")
            except CallLog.DoesNotExist:
                print(f"Call log with call_id {call_id} not found, creating new")
                pass
        
        if existing_call_log:
            # UPDATE existing call log
            # Remove fields that shouldn't be updated
            data.pop('created_at', None)
            data.pop('date', None)
            
            # Don't change call_id
            if 'call_id' in data:
                data.pop('call_id')
            
            serializer = self.get_serializer(existing_call_log, data=data, partial=True)
        else:
            # CREATE new call log
            # Remove is_editing flag before saving
            data.pop('is_editing', None)
            serializer = self.get_serializer(data=data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
            return Response(
                {'error': f'Validation failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set order if order_id is provided
        order_id = data.get('order_id')
        if order_id:
            try:
                order = Order.objects.get(order_id=order_id)
                serializer.validated_data['order'] = order
            except Order.DoesNotExist:
                pass
        
        call_log = serializer.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# ========== LEAD VIEWSET ==========
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = LeadPagination

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

# ========== CATEGORY VIEWSET ==========
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Category.objects.filter(is_active=True)
        parent_id_str = self.request.query_params.get('parent_id', '').strip()
        if parent_id_str:
            try:
                parent_id = int(parent_id_str)
                queryset = queryset.filter(parent_id=parent_id)
            except ValueError:
                # Invalid parent_id (non-integer) - return empty queryset
                queryset = Category.objects.none()
        else:
            # No parent_id or empty → top-level categories
            queryset = queryset.filter(parent__isnull=True)
        return queryset

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Soft delete: set is_active=False instead of hard delete
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

# ========== ORGANIZATION TYPE VIEWSET ==========
class OrganizationTypeViewSet(viewsets.ModelViewSet):
    queryset = OrganizationType.objects.filter(is_active=True)
    serializer_class = OrganizationTypeSerializer
    permission_classes = [IsAuthenticated]

# ========== GST RATE VIEWSET ==========
class GSTRateViewSet(viewsets.ModelViewSet):
    queryset = GSTRate.objects.filter(is_active=True)
    serializer_class = GSTRateSerializer
    permission_classes = [IsAuthenticated]

# ========== PRODUCT COMBINATION VIEWSET ==========
class ProductCombinationViewSet(viewsets.ModelViewSet):
    queryset = ProductCombination.objects.prefetch_related(
        'items__product',
        'rewards__product',
        'gifts__product'
    ).filter(is_active=True)
    serializer_class = ProductCombinationSerializer
    permission_classes = [IsAuthenticated]

# ========== UNIT VIEWSET ==========
# views.py - Update both ViewSets
class UnitViewSet(viewsets.ModelViewSet):
    """Product units only"""
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Unit.objects.filter(is_active=True, unit_type__in=['product', 'both'])

class PackingUnitViewSet(viewsets.ModelViewSet):
    """Packing units only"""
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Unit.objects.filter(is_active=True, unit_type__in=['packing', 'both'])

class ProductPricingViewSet(viewsets.ModelViewSet):
    queryset = ProductPricing.objects.select_related('product__category', 'product__gst_rate').all()
    serializer_class = ProductPricingSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['product']

# ========== CUSTOMER TYPE VIEWSET ==========
class CustomerTypeViewSet(viewsets.ModelViewSet):
    queryset = CustomerType.objects.filter(is_active=True)
    serializer_class = CustomerTypeSerializer
    permission_classes = [IsAuthenticated]

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


# ========== AUTHENTICATION VIEWS ==========
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        role = request.data.get('role', 'employee')

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


# PhoneViewSet for PATCH /api/phones/<id>/
class PhoneViewSet(viewsets.ModelViewSet):
    queryset = Phone.objects.all()
    serializer_class = PhoneSerializer
    permission_classes = [IsAuthenticated]
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



