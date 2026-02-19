from rest_framework import serializers
from .models import PatrolPlan

class PatrolPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatrolPlan
        fields = '__all__'
        read_only_fields = ['officer_name', 'created_at']
