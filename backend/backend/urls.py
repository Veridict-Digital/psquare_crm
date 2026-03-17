from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('crm.urls')),
]

# Serve media files in both DEBUG and production modes  
# This ensures uploaded images are accessible at /media/products/...
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
