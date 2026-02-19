from django.contrib.auth.models import User

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("Superuser 'admin' created successfully.")
    print("Username: admin")
    print("Password: admin123")
else:
    # Ensure is_staff is True for existing admin
    admin = User.objects.get(username='admin')
    if not admin.is_staff:
        admin.is_staff = True
        admin.save()
        print("Admin user updated - is_staff set to True")
    else:
        print("Superuser 'admin' already exists.")
        print("Username: admin")
        print("Password: admin123")
