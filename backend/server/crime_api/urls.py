from django.urls import path
from .views import (
    health,
    metadata,
    predict_risk_year_detailed,
    risk_by_district,
    crime_count_by_district,
    predict_next_crime,
    predict_risk_by_district,
    predict_risk_year,
    predict_risk,  # New endpoint for police dashboard
)
from . import analytics_views, auth_views, admin_views

urlpatterns = [
    path("health/", health),
    path("metadata/", metadata),
    path("risk-by-district/", risk_by_district),
    path("crime-count-by-district/", crime_count_by_district),

    # ML
    path("predict-next-crime/", predict_next_crime),
    path("predict-risk-by-district/", predict_risk_by_district),
    path("predict-risk-year/", predict_risk_year),
    path("predict-risk-year-detailed/", predict_risk_year_detailed),
    path("predict-risk/", predict_risk),  # Single district risk prediction

    # Analytics
    path("analytics/trends/", analytics_views.trends),
    path("analytics/compare-districts/", analytics_views.compare_districts),
    path("analytics/model-metrics/", analytics_views.model_metrics),

    # Auth
    path("auth/login/", auth_views.login_view),
    path("auth/register/", auth_views.register_view),
    path("auth/logout/", auth_views.logout_view),
    path("auth/whoami/", auth_views.whoami_view),

    # Admin
    # Admin Records
    path("admin/records/", admin_views.list_records),
    path("admin/records/create/", admin_views.create_record),
    path("admin/records/<int:pk>/update/", admin_views.update_record),
    path("admin/records/<int:pk>/delete/", admin_views.delete_record),

    # Admin User Management
    path("admin/users/", admin_views.list_users),
    path("admin/users/<int:user_id>/role/", admin_views.update_user_role),
    path("admin/users/<int:user_id>/delete/", admin_views.delete_user),
    
    # Manual Sync
    path("admin/force-sync/", admin_views.force_sync),

    # Police
    path("police/patrols/", admin_views.manage_patrols),
    path("police/patrols/<int:patrol_id>/status/", admin_views.update_patrol_status),
]
