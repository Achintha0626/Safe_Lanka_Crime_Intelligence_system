from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .models import CrimeRecord, UserProfile, PatrolPlan
from .services.data_sync import sync_db_to_csv
from django.contrib.auth.models import User
from django.utils import timezone
from .serializers import PatrolPlanSerializer

@api_view(["POST"])
@permission_classes([IsAdminUser])
def force_sync(request):
    """
    Manually trigger data sync from DB to CSV and reload ML data.
    """
    try:
        sync_db_to_csv()
        return Response({"status": "success", "message": "Data synced and ML data reloaded successfully."})
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_records(request):
    """
    List all records for Admin Table.
    Pagination recommended for large datasets, but for simplicity returning subset or filter.
    """
    # Limit to recent 100 or filter
    year = request.GET.get('year')
    qs = CrimeRecord.objects.all()
    if year:
        qs = qs.filter(year=year)
    
    # Return last 200 records by default if no filter
    if not year:
        qs = qs[:200]
        
    data = list(qs.values())
    return Response(data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_record(request):
    data = request.data
    try:
        CrimeRecord.objects.create(
            year=data['year'],
            month=data['month'],
            district=data['district'],
            police_division=data.get('police_division', ''),
            crime_type=data['crime_type'],
            crime_count=data['crime_count']
        )
        sync_db_to_csv()
        return Response({"status": "created", "message": "Record created and system synced."})
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(["PUT"])
@permission_classes([IsAdminUser])
def update_record(request, pk):
    try:
        obj = CrimeRecord.objects.get(pk=pk)
        data = request.data
        
        obj.year = data.get('year', obj.year)
        obj.month = data.get('month', obj.month)
        obj.district = data.get('district', obj.district)
        obj.police_division = data.get('police_division', obj.police_division)
        obj.crime_type = data.get('crime_type', obj.crime_type)
        obj.crime_count = data.get('crime_count', obj.crime_count)
        
        obj.save()
        sync_db_to_csv()
        return Response({"status": "updated", "message": "Record updated and system synced."})
    except CrimeRecord.DoesNotExist:
        return Response({"error": "Record not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_record(request, pk):
    try:
        record = CrimeRecord.objects.get(pk=pk)
        record.delete()
        sync_db_to_csv() # Trigger sync
        return Response({"message": "Record deleted successfully"}, status=200)
    except CrimeRecord.DoesNotExist:
        return Response({"error": "Record not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

# --- USER MANAGEMENT (ADMIN ONLY) ---
@api_view(["GET"])
@permission_classes([IsAdminUser])
def list_users(request):
    users = User.objects.all().select_related('profile')
    data = []
    for u in users:
        role = "GUEST"
        if hasattr(u, 'profile'):
            role = u.profile.role
        elif u.is_staff:
            role = "ADMIN"
        
        data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": role,
            "is_staff": u.is_staff
        })
    return Response(data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def update_user_role(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        new_role = request.data.get("role")
        
        if new_role not in ['ADMIN', 'SUPERVISOR', 'OFFICER', 'ANALYST', 'GUEST', 'POLICE']:
            return Response({"error": "Invalid role"}, status=400)

        # Create or update profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.role = new_role
        profile.save()
        
        # Sync is_staff for Admin
        if new_role == 'ADMIN':
            user.is_staff = True
        else:
            user.is_staff = False
        user.save()

        return Response({"message": f"User role updated to {new_role}"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_user(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
        if user.is_superuser:
             return Response({"error": "Cannot delete superuser"}, status=403)
        user.delete()
        return Response({"message": "User deleted"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

# --- POLICE PATROL MANAGEMENT ---
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def manage_patrols(request):
    # Check if user has patrol management permissions (OFFICER, SUPERVISOR, or ADMIN)
    # Also accept legacy 'POLICE' role for backwards compatibility
    user_role = getattr(request.user.profile, 'role', None) if hasattr(request.user, 'profile') else None
    is_authorized = user_role in ['OFFICER', 'SUPERVISOR', 'ADMIN', 'POLICE'] or request.user.is_staff
    
    if not is_authorized:
        return Response({"error": "Unauthorized"}, status=403)

    if request.method == "GET":
        # List future patrols
        patrols = PatrolPlan.objects.filter(date__gte=timezone.now().date()).order_by('date', 'shift')
        serializer = PatrolPlanSerializer(patrols, many=True)
        return Response(serializer.data)
    
    elif request.method == "POST":
        serializer = PatrolPlanSerializer(data=request.data)
        if serializer.is_valid():
            # New patrols start as PLANNED
            serializer.save(officer_name=request.user.username, status='PLANNED')
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_patrol_status(request, patrol_id):
    """
    Update patrol status with role-based permissions:
    - OFFICER: Can only update notes when status is ACTIVE
    - SUPERVISOR/ADMIN: Can change status to ACTIVE, COMPLETED, or CANCELLED
    """
    try:
        patrol = PatrolPlan.objects.get(id=patrol_id)
    except PatrolPlan.DoesNotExist:
        return Response({"error": "Patrol not found"}, status=404)
    
    # Get user role
    user_role = getattr(request.user.profile, 'role', None) if hasattr(request.user, 'profile') else None
    if not user_role and request.user.is_staff:
        user_role = 'ADMIN'
    
    new_status = request.data.get('status')
    notes = request.data.get('notes')
    
    # Role-based permission check
    if new_status:
        # Only SUPERVISOR and ADMIN can change status
        if user_role not in ['SUPERVISOR', 'ADMIN']:
            return Response({
                "error": "Only Supervisors and Administrators can change patrol status"
            }, status=403)
        
        # Validate status transition
        valid_statuses = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']
        if new_status not in valid_statuses:
            return Response({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}, status=400)
        
        # Business logic validations
        if patrol.status == 'COMPLETED' and new_status != 'COMPLETED':
            return Response({"error": "Cannot change status of a completed patrol"}, status=400)
        
        if patrol.status == 'CANCELLED' and new_status != 'CANCELLED':
            return Response({"error": "Cannot change status of a cancelled patrol"}, status=400)
        
        patrol.status = new_status
    
    # Update notes (any authorized user can update notes)
    if notes is not None:
        patrol.notes = notes
    
    patrol.save()
    serializer = PatrolPlanSerializer(patrol)
    return Response(serializer.data)
