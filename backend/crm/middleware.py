"""
Authenticate JWT early so AuditlogMiddleware can record the real user.

DRF JWT auth normally runs only inside the view — after middleware — so
django-auditlog would otherwise store actor=None ("System").
"""
from django.contrib.auth.models import AnonymousUser


class JWTAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, 'user', None)
        if user is None or isinstance(user, AnonymousUser) or not getattr(user, 'is_authenticated', False):
            try:
                from rest_framework_simplejwt.authentication import JWTAuthentication

                result = JWTAuthentication().authenticate(request)
                if result is not None:
                    request.user, request.auth = result
            except Exception:
                pass
        return self.get_response(request)
