from django.db import models
from django.utils import timezone

class CrimeRecord(models.Model):
    year = models.IntegerField()
    month = models.IntegerField()
    district = models.CharField(max_length=100)
    police_division = models.CharField(max_length=100, blank=True, null=True)
    crime_type = models.CharField(max_length=150)
    crime_count = models.IntegerField(default=0)
    
    # Metadata for sync
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-year', '-month']
        indexes = [
            models.Index(fields=['year', 'month']),
            models.Index(fields=['district']),
        ]

    def __str__(self):
        return f"{self.year}-{self.month} | {self.district} | {self.crime_type}"


class ResearchNote(models.Model):
    title = models.CharField(max_length=200)
    note_content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    # Could add user link later if needed
    
    def __str__(self):
        return self.title
class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('SUPERVISOR', 'Supervisor'),
        ('OFFICER', 'Police Officer'),
        ('ANALYST', 'Analyst'),
        ('GUEST', 'Guest User'),
    ]
    user = models.OneToOneField("auth.User", on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='GUEST')

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class PatrolPlan(models.Model):
    STATUS_CHOICES = [
        ('PLANNED', 'Planned'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    district = models.CharField(max_length=100)
    date = models.DateField()
    shift = models.CharField(max_length=50, choices=[('Morning', 'Morning'), ('Evening', 'Evening'), ('Night', 'Night')])
    officer_name = models.CharField(max_length=150)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.district} - {self.date} ({self.shift}) - {self.status}"
