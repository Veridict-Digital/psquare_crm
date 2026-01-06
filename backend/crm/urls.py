from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, CustomerViewSet, ProductViewSet, OrderViewSet, CallLogViewSet, LoginView, RegisterView, DashboardView, CustomerAssumptionViewSet, CustomerAssumption2ViewSet, CustomerAssumption3ViewSet, LeadViewSet, GSTRateViewSet, CategoryViewSet
from .auth_views import send_registration_otp, verify_registration_otp, send_password_reset_otp, verify_password_reset_otp

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'calllogs', CallLogViewSet)
router.register(r'assumptions', CustomerAssumptionViewSet)
router.register(r'assumptions2', CustomerAssumption2ViewSet)
router.register(r'assumptions3', CustomerAssumption3ViewSet)
router.register(r'leads', LeadViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'gstrates', GSTRateViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
    path('api/send_registration_otp/', send_registration_otp, name='send_registration_otp'),
    path('api/verify_registration_otp/', verify_registration_otp, name='verify_registration_otp'),
    path('api/send_password_reset_otp/', send_password_reset_otp, name='send_password_reset_otp'),
    path('api/verify_password_reset_otp/', verify_password_reset_otp, name='verify_password_reset_otp'),
]
