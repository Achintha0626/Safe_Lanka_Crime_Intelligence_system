import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User

def fix_admin():
    print("Checking admin user...")
    try:
        user = User.objects.get(username='admin')
        print("User 'admin' found.")
        user.set_password('admin123')
        user.save()
        print("SUCCESS: Password reset to 'admin123'.")
    except User.DoesNotExist:
        print("User 'admin' not found.")
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("SUCCESS: User 'admin' created with password 'admin123'.")

if __name__ == "__main__":
    fix_admin()
