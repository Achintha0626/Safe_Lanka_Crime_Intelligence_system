import os
import django
import csv
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from crime_api.models import CrimeRecord

def import_csv_data():
    # Define file path
    base_dir = Path(__file__).resolve().parent.parent
    csv_file_path = base_dir / 'data' / 'processed' / 'crime_ml_ready_multi_year_cleaned.csv'

    if not csv_file_path.exists():
        print(f"Error: File not found at {csv_file_path}")
        return

    print(f"Reading data from: {csv_file_path}")
    
    count_created = 0
    count_skipped = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                # Extract fields
                year = int(row['year'])
                month = int(row['month'])
                district = row['district']
                police_division = row.get('police_division', '') 
                if not police_division: # Handle None or empty string
                     police_division = ''
                crime_type = row['crime_type']
                try:
                    crime_count = int(row['crime_count'])
                except ValueError:
                    crime_count = 0
                
                # Check for existing record to avoid duplicates
                # We assume a unique constraint on year, month, district, police_division, crime_type
                obj, created = CrimeRecord.objects.get_or_create(
                    year=year,
                    month=month,
                    district=district,
                    police_division=police_division,
                    crime_type=crime_type,
                    defaults={'crime_count': crime_count}
                )
                
                if created:
                    count_created += 1
                else:
                    # Update if count is different?
                    if obj.crime_count != crime_count:
                        obj.crime_count = crime_count
                        obj.save()
                        print(f"Updated record: {year}-{month} {district} {crime_type}")
                    count_skipped += 1
                    
        print("-" * 30)
        print(f"Import Finished")
        print(f"Records Created: {count_created}")
        print(f"Records Skipped/Updated: {count_skipped}")
        print("-" * 30)

    except Exception as e:
        print(f"Error during import: {e}")

if __name__ == '__main__':
    import_csv_data()
