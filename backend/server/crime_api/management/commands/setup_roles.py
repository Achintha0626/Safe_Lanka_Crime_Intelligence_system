from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from crime_api.models import UserProfile

class Command(BaseCommand):
    help = 'Creates test users with different roles'

    def handle(self, *args, **kwargs):
        users = [
            {'username': 'officer', 'password': 'password123', 'role': 'POLICE'},
            {'username': 'analyst', 'password': 'password123', 'role': 'ANALYST'},
            {'username': 'admin_user', 'password': 'password123', 'role': 'ADMIN', 'is_staff': True},
        ]

        for u in users:
            user, created = User.objects.get_or_create(username=u['username'])
            user.set_password(u['password'])
            if u.get('is_staff'):
                user.is_staff = True
            user.save()
            
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = u['role']
            profile.save()
            
            self.stdout.write(self.style.SUCCESS(f"User {u['username']} ({u['role']}) ready."))
