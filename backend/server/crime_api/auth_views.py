from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import UserProfile

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        # Get role
        role = "GUEST"
        if hasattr(user, 'profile'):
            role = user.profile.role
        elif user.is_staff:
            role = "ADMIN"
            
        return Response({
            "status": "success", 
            "username": user.username, 
            "role": role,
            "is_staff": user.is_staff
        })
    else:
        return Response({"error": "Invalid credentials"}, status=401)

@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    email = request.data.get("email", "")
    
    # Validation
    if not username or not password:
        return Response({"error": "Username and password are required"}, status=400)
    
    if len(password) < 6:
        return Response({"error": "Password must be at least 6 characters"}, status=400)
    
    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)
    
    try:
        # Create user
        user = User.objects.create_user(username=username, password=password, email=email)
        
        # Create profile with GUEST role
        UserProfile.objects.create(user=user, role='GUEST')
        
        return Response({
            "status": "success",
            "message": "Account created successfully. Please login.",
            "username": username
        })
    except Exception as e:
        return Response({"error": f"Registration failed: {str(e)}"}, status=500)

@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"status": "logged_out"})

@api_view(["GET"])
@ensure_csrf_cookie
def whoami_view(request):
    if request.user.is_authenticated:
        role = "GUEST"
        if hasattr(request.user, 'profile'):
            role = request.user.profile.role
        elif request.user.is_staff:
            role = "ADMIN"

        return Response({
            "authenticated": True, 
            "username": request.user.username,
            "role": role,
            "is_staff": request.user.is_staff
        })
    return Response({"authenticated": False})
