# Database Access Guide

This guide explains how to access, view, and manage the SafeLanka database.

## Database Overview

SafeLanka uses **SQLite** as its database, which is stored in:

```
backend/server/db.sqlite3
```

### Database Tables

1. **auth_user** - Django authentication (users, passwords)
2. **crime_api_crimerecord** - Historical and predicted crime data
3. **crime_api_userprofile** - User roles and permissions
4. **crime_api_patrolplan** - Police patrol schedules
5. **crime_api_researchnote** - Research notes and documentation

## Method 1: Django Admin Panel (Easiest)

### Step 1: Start the Backend Server

```bash
cd backend/server
python manage.py runserver 8002
```

### Step 2: Access Admin Panel

- Open browser: `http://localhost:8002/admin`
- Login with credentials:
  - Username: `admin`
  - Password: `admin123`

### Step 3: Browse Data

You'll see sections for:

- **AUTHENTICATION AND AUTHORIZATION**
  - Groups
  - Users
- **CRIME_API**
  - Crime records (with filters for year, month, district, crime type)
  - User profiles (with role filtering)
  - Patrol plans (with status, date, district filters)

### Features Available in Admin Panel:

- ✅ Search across records
- ✅ Filter by multiple criteria
- ✅ Sort by columns
- ✅ Add new records
- ✅ Edit existing records
- ✅ Delete records (with confirmation)
- ✅ Export data (using Django extensions)
- ✅ Pagination (50 records per page)

## Method 2: Django Shell (For Developers)

### Access the Shell

```bash
cd backend/server
python manage.py shell
```

### Example Queries

#### View All Users

```python
from django.contrib.auth.models import User
users = User.objects.all()
for user in users:
    print(f"{user.username} - {user.email}")
```

#### View User Profiles with Roles

```python
from crime_api.models import UserProfile
profiles = UserProfile.objects.all()
for profile in profiles:
    print(f"{profile.user.username}: {profile.role}")
```

#### Query Crime Records

```python
from crime_api.models import CrimeRecord

# Get all crimes in Colombo for 2024
colombo_crimes = CrimeRecord.objects.filter(
    district='Colombo',
    year=2024
)

# Get total crime count
total_count = sum(crime.crime_count for crime in colombo_crimes)
print(f"Total crimes in Colombo 2024: {total_count}")

# Get crimes by type
for crime_type in colombo_crimes.values('crime_type').distinct():
    crimes = CrimeRecord.objects.filter(
        district='Colombo',
        year=2024,
        crime_type=crime_type['crime_type']
    )
    total = sum(c.crime_count for c in crimes)
    print(f"{crime_type['crime_type']}: {total}")
```

#### View Patrol Plans

```python
from crime_api.models import PatrolPlan

# Get active patrols
active_patrols = PatrolPlan.objects.filter(status='ACTIVE')
for patrol in active_patrols:
    print(f"{patrol.district} - {patrol.date} ({patrol.shift}) - {patrol.officer_name}")

# Get patrols by district
district_patrols = PatrolPlan.objects.filter(district='Colombo')
print(f"Total patrols in Colombo: {district_patrols.count()}")
```

#### Create New Records

```python
from crime_api.models import CrimeRecord
from datetime import datetime

# Create a new crime record
new_record = CrimeRecord.objects.create(
    year=2026,
    month=2,
    district='Colombo',
    police_division='Colombo Central',
    crime_type='Theft',
    crime_count=45
)
print(f"Created: {new_record}")
```

#### Update Records

```python
# Update patrol status
patrol = PatrolPlan.objects.get(id=1)
patrol.status = 'COMPLETED'
patrol.notes = 'Patrol completed successfully'
patrol.save()
```

#### Delete Records

```python
# Delete a specific record
crime = CrimeRecord.objects.get(id=100)
crime.delete()

# Bulk delete (be careful!)
# CrimeRecord.objects.filter(year=2020).delete()
```

## Method 3: SQLite Browser (Visual Tool)

### Step 1: Download DB Browser

- Windows/Mac/Linux: [https://sqlitebrowser.org/](https://sqlitebrowser.org/)

### Step 2: Open Database

1. Launch DB Browser for SQLite
2. Click "Open Database"
3. Navigate to `backend/server/db.sqlite3`
4. Click "Open"

### Step 3: Browse Data

- **Browse Data** tab: View table contents
- **Database Structure** tab: See table schemas
- **Execute SQL** tab: Run custom queries

### Example SQL Queries

#### Total Crimes by District (2024)

```sql
SELECT
    district,
    SUM(crime_count) as total_crimes
FROM crime_api_crimerecord
WHERE year = 2024
GROUP BY district
ORDER BY total_crimes DESC;
```

#### Monthly Crime Trend

```sql
SELECT
    year,
    month,
    SUM(crime_count) as total_crimes
FROM crime_api_crimerecord
WHERE district = 'Colombo'
GROUP BY year, month
ORDER BY year, month;
```

#### Users with Their Roles

```sql
SELECT
    u.username,
    u.email,
    p.role
FROM auth_user u
LEFT JOIN crime_api_userprofile p ON u.id = p.user_id
ORDER BY u.username;
```

#### Active Patrol Plans

```sql
SELECT
    district,
    date,
    shift,
    officer_name,
    status
FROM crime_api_patrolplan
WHERE status = 'ACTIVE'
ORDER BY date, shift;
```

## Method 4: Python Script

Create a custom script to query the database:

```python
# query_db.py
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from crime_api.models import CrimeRecord, UserProfile, PatrolPlan
from django.contrib.auth.models import User

def main():
    print("\n=== SafeLanka Database Summary ===\n")

    # User Statistics
    total_users = User.objects.count()
    admin_users = User.objects.filter(is_superuser=True).count()
    print(f"Total Users: {total_users}")
    print(f"Admin Users: {admin_users}")

    # Crime Statistics
    total_records = CrimeRecord.objects.count()
    latest_year = CrimeRecord.objects.order_by('-year').first().year
    print(f"\nTotal Crime Records: {total_records}")
    print(f"Latest Data Year: {latest_year}")

    # Patrol Statistics
    total_patrols = PatrolPlan.objects.count()
    active_patrols = PatrolPlan.objects.filter(status='ACTIVE').count()
    print(f"\nTotal Patrol Plans: {total_patrols}")
    print(f"Active Patrols: {active_patrols}")

    # Top 5 Districts by Crime Count (latest year)
    print(f"\nTop 5 Districts by Crime Count ({latest_year}):")
    from django.db.models import Sum
    top_districts = CrimeRecord.objects.filter(year=latest_year) \
        .values('district') \
        .annotate(total=Sum('crime_count')) \
        .order_by('-total')[:5]

    for i, district in enumerate(top_districts, 1):
        print(f"  {i}. {district['district']}: {district['total']:,} crimes")

if __name__ == '__main__':
    main()
```

Run the script:

```bash
cd backend/server
python query_db.py
```

## Database Backup & Restore

### Backup Database

```bash
# Simple copy
cp backend/server/db.sqlite3 backend/server/db.backup.sqlite3

# With timestamp
cp backend/server/db.sqlite3 backend/server/db.backup.$(date +%Y%m%d_%H%M%S).sqlite3
```

### Restore Database

```bash
cp backend/server/db.backup.sqlite3 backend/server/db.sqlite3
```

### Export Data (Django)

```bash
cd backend/server

# Export all data
python manage.py dumpdata > data_backup.json

# Export specific app
python manage.py dumpdata crime_api > crime_data.json

# Export specific model
python manage.py dumpdata crime_api.CrimeRecord > crime_records.json
```

### Import Data (Django)

```bash
cd backend/server
python manage.py loaddata data_backup.json
```

## Troubleshooting Database Issues

### Issue: Database is locked

**Solution:**

1. Close all connections to the database
2. Stop the Django server
3. Close DB Browser if open
4. Restart Django server

### Issue: Migration errors

**Solution:**

```bash
cd backend/server
python manage.py migrate --fake crime_api zero
python manage.py migrate crime_api
```

### Issue: Can't access admin panel

**Solution:**

```bash
cd backend/server
python create_admin.py
```

### Issue: Database corrupted

**Solution:**

1. Restore from backup
2. Or reset database:

```bash
cd backend/server
rm db.sqlite3
python manage.py migrate
python create_admin.py
python manage.py seed_data  # If you have seed data
```

## Database Schema

### CrimeRecord

- `id` - Primary key
- `year` - Crime year
- `month` - Crime month (1-12)
- `district` - District name
- `police_division` - Police division (optional)
- `crime_type` - Type of crime
- `crime_count` - Number of crimes
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp

### UserProfile

- `id` - Primary key
- `user_id` - Foreign key to auth_user
- `role` - User role (ADMIN/SUPERVISOR/OFFICER/ANALYST/GUEST)

### PatrolPlan

- `id` - Primary key
- `district` - District name
- `date` - Patrol date
- `shift` - Shift time (Morning/Evening/Night)
- `officer_name` - Assigned officer
- `notes` - Additional notes
- `status` - Plan status (PLANNED/ACTIVE/COMPLETED/CANCELLED)
- `created_at` - Plan creation timestamp
- `updated_at` - Last update timestamp

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change default admin password** in production
2. **Never commit** `db.sqlite3` to version control (add to `.gitignore`)
3. **Use environment variables** for sensitive settings
4. **Regular backups** of the database
5. **Restrict admin panel access** in production
6. **Use PostgreSQL or MySQL** for production (SQLite is for development)

## Additional Resources

- [Django Admin Documentation](https://docs.djangoproject.com/en/4.2/ref/contrib/admin/)
- [Django ORM Queries](https://docs.djangoproject.com/en/4.2/topics/db/queries/)
- [SQLite Browser Documentation](https://sqlitebrowser.org/docs/)
- [Django Database API](https://docs.djangoproject.com/en/4.2/topics/db/)

---

**Need help?** Check the main [README.md](README.md) for general setup instructions.
