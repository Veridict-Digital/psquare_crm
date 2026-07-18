from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import FlavourViewSet, PackingUnitViewSet, ResidualViewSet, UserViewSet, CustomerViewSet, ProductViewSet, OrderViewSet, CallLogViewSet, LoginView, RegisterView, DashboardView, CustomerAssumptionViewSet, CustomerAssumption2ViewSet, CustomerAssumption3ViewSet, LeadViewSet, GSTRateViewSet, CategoryViewSet, OrganizationTypeViewSet, ProductCombinationViewSet, UnitViewSet, CustomerTypeViewSet, BrandViewSet, BrandCategoryViewSet,BrandCategory1ViewSet, ProductPricingViewSet, PhoneViewSet, OldOrderHistoryViewSet, RoleViewSet, RolePermissionViewSet, LanguageViewSet, CommunityViewSet
from .auth_views import send_registration_otp, verify_registration_otp, send_password_reset_otp, verify_password_reset_otp

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'role-permissions', RolePermissionViewSet, basename='rolepermission')
router.register(r'customers', CustomerViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'old-order-histories', OldOrderHistoryViewSet, basename='oldorderhistory')
router.register(r'calllogs', CallLogViewSet)
router.register(r'assumptions', CustomerAssumptionViewSet)
router.register(r'assumptions2', CustomerAssumption2ViewSet)
router.register(r'assumptions3', CustomerAssumption3ViewSet)
router.register(r'leads', LeadViewSet)
router.register(r'categories', CategoryViewSet)
# In your urls.py, register the new viewsets
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'brand-categories', BrandCategoryViewSet, basename='brand-category')
router.register(r'flavours', FlavourViewSet)
router.register(r'residuals', ResidualViewSet)
router.register(r'brand-categories-1', BrandCategory1ViewSet)
router.register(r'organizationtypes', OrganizationTypeViewSet)
router.register(r'gstrates', GSTRateViewSet)
router.register(r'productcombinations', ProductCombinationViewSet)
router.register(r'units', UnitViewSet , basename='unit')
router.register(r'packing-units', PackingUnitViewSet , basename='packing-unit')
router.register(r'customertypes', CustomerTypeViewSet)
router.register(r'languages', LanguageViewSet)
router.register(r'communities', CommunityViewSet)
router.register(r'productpricings', ProductPricingViewSet)
router.register(r'phones', PhoneViewSet)

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
