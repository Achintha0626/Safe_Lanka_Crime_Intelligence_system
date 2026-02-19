"""
Manual sync script to update CSV and reload ML data
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from crime_api.services.data_sync import sync_db_to_csv

print("="*60)
print("MANUAL DATA SYNC")
print("="*60)

try:
    sync_db_to_csv()
    print("\n✓ Data sync completed successfully!")
    print("✓ CSV updated with latest database records")
    print("✓ Risk zones recalculated")
    print("✓ ML data reloaded in memory")
except Exception as e:
    print(f"\n✗ Sync failed: {e}")
    import traceback
    traceback.print_exc()
