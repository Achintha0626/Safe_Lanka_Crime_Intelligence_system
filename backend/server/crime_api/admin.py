from django.contrib import admin
from .models import CrimeRecord, UserProfile, PatrolPlan

# Register your models here.

@admin.register(CrimeRecord)
class CrimeRecordAdmin(admin.ModelAdmin):
    list_display = ('year', 'month', 'district', 'police_division', 'crime_type', 'crime_count')
    list_filter = ('year', 'month', 'district', 'crime_type')
    search_fields = ('district', 'police_division', 'crime_type')
    ordering = ('-year', '-month')
    list_per_page = 50

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')

@admin.register(PatrolPlan)
class PatrolPlanAdmin(admin.ModelAdmin):
    list_display = ('district', 'date', 'shift', 'officer_name', 'status', 'created_at')
    list_filter = ('status', 'shift', 'district', 'date')
    search_fields = ('district', 'officer_name', 'notes')
    ordering = ('-date', 'shift')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Patrol Information', {
            'fields': ('district', 'date', 'shift', 'officer_name')
        }),
        ('Status & Notes', {
            'fields': ('status', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
