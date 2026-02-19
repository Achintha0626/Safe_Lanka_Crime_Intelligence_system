from django.contrib.auth.models import User
try:
    user = User.objects.get(username='admin')
    print("User 'admin' exists.")
    user.set_password('admin123')
    user.save()
    print("Password reset to 'admin123'.")
except User.DoesNotExist:
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("User 'admin' created with password 'admin123'.")
