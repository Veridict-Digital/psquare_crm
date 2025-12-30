import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTP

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(email, otp, purpose):
    subject = f'Your OTP for {purpose}'
    message = f'Your OTP is: {otp}. It will expire in 5 minutes.'
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])

@api_view(['POST'])
@permission_classes([AllowAny])
def send_registration_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    otp = generate_otp()
    OTP.objects.filter(email=email, purpose='registration', is_used=False).update(is_used=True)
    OTP.objects.create(email=email, otp=otp, purpose='registration')

    send_otp_email(email, otp, 'Registration')
    return Response({'message': 'OTP sent successfully'})

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_registration_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    username = request.data.get('username')
    password = request.data.get('password')
    role = request.data.get('role', 'Employee')

    if not all([email, otp, username, password]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        otp_obj = OTP.objects.get(email=email, otp=otp, purpose='registration', is_used=False)
        if otp_obj.is_expired():
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password, role=role)
        otp_obj.is_used = True
        otp_obj.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
            }
        })
    except OTP.DoesNotExist:
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_password_reset_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    if not User.objects.filter(email=email).exists():
        return Response({'error': 'Email not found'}, status=status.HTTP_400_BAD_REQUEST)

    otp = generate_otp()
    OTP.objects.filter(email=email, purpose='password_reset', is_used=False).update(is_used=True)
    OTP.objects.create(email=email, otp=otp, purpose='password_reset')

    send_otp_email(email, otp, 'Password Reset')
    return Response({'message': 'OTP sent successfully'})

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_password_reset_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    new_password = request.data.get('new_password')

    if not all([email, otp, new_password]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        otp_obj = OTP.objects.get(email=email, otp=otp, purpose='password_reset', is_used=False)
        if otp_obj.is_expired():
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()

        otp_obj.is_used = True
        otp_obj.save()

        return Response({'message': 'Password reset successfully'})
    except OTP.DoesNotExist:
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)
