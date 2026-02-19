from django.core.management.base import BaseCommand
from crime_api.models import CrimeRecord
import pandas as pd
import os

class Command(BaseCommand):
    help = 'Seeds the CrimeRecord table from CSV'

    def handle(self, *args, **kwargs):
        # Path to processed CSV
        # Assuming run from backend/server/
        # Path to processed CSV
        # Assuming run from backend/server/crime_api/management/commands/seed_data.py
        # __file__ dir is .../commands
        # Needs to go up to backend/
        # commands -> management -> crime_api -> server -> backend (5 levels up from file)
        
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
        
        # User prompt said "crime_monthly_clean.csv" for historical data?
        # Let's check crime_ml_ready_multi_year.csv as it seems to have more fields
        # But for "Seed Data", we want raw-ish records.
        # crime_monthly_clean.csv: year,month,district,crime_type,crime_count
        # crime_ml_ready_multi_year_cleaned.csv: + police_division, risk_zone, trend (cleaned districts)
        
        # I'll use crime_ml_ready_multi_year_cleaned.csv because it has police_division which is in my model.
        
        csv_path = os.path.join(base_dir, 'data', 'processed', 'crime_ml_ready_multi_year_cleaned.csv')
        
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f'CSV not found at {csv_path}'))
            return

        self.stdout.write(f"Reading from {csv_path}...")
        df = pd.read_csv(csv_path)
        
        records = []
        # optimization: bulk_create
        self.stdout.write("Preparing records...")
        
        # Clear existing?
        CrimeRecord.objects.all().delete()
        
        for _, row in df.iterrows():
            records.append(CrimeRecord(
                year=int(row['year']),
                month=int(row['month']),
                district=str(row['district']),
                police_division=str(row.get('police_division', '')),
                crime_type=str(row['crime_type']),
                crime_count=int(row.get('crime_count', 0))
            ))
            
            if len(records) >= 5000:
                CrimeRecord.objects.bulk_create(records)
                records = []
                self.stdout.write(".", ending="")
        
        if records:
            CrimeRecord.objects.bulk_create(records)
            
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully seeded {CrimeRecord.objects.count()} records.'))
