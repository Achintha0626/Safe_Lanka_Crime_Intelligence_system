# Generated migration for patrol workflow system

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('crime_api', '0002_patrolplan_userprofile'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('ADMIN', 'Administrator'),
                    ('SUPERVISOR', 'Supervisor'),
                    ('OFFICER', 'Police Officer'),
                    ('ANALYST', 'Analyst'),
                    ('GUEST', 'Guest User')
                ],
                default='GUEST',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='patrolplan',
            name='status',
            field=models.CharField(
                choices=[
                    ('PLANNED', 'Planned'),
                    ('ACTIVE', 'Active'),
                    ('COMPLETED', 'Completed'),
                    ('CANCELLED', 'Cancelled')
                ],
                default='PLANNED',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='patrolplan',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
