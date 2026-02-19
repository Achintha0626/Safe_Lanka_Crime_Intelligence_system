# Migration to update existing POLICE roles to OFFICER

from django.db import migrations


def update_police_to_officer(apps, schema_editor):
    """Update all existing POLICE role users to OFFICER"""
    UserProfile = apps.get_model('crime_api', 'UserProfile')
    UserProfile.objects.filter(role='POLICE').update(role='OFFICER')


def reverse_update(apps, schema_editor):
    """Reverse migration - change OFFICER back to POLICE"""
    UserProfile = apps.get_model('crime_api', 'UserProfile')
    UserProfile.objects.filter(role='OFFICER').update(role='POLICE')


class Migration(migrations.Migration):

    dependencies = [
        ('crime_api', '0003_add_patrol_status'),
    ]

    operations = [
        migrations.RunPython(update_police_to_officer, reverse_update),
    ]
