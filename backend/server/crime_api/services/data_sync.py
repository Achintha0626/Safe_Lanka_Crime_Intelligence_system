import os
import pandas as pd
from crime_api.models import CrimeRecord
from django.conf import settings
from crime_api.views import reload_ml_data_internal

# Path to CSV
# We need to construct path relative to backend root or use settings
# Just re-using the path logic or hardcoded for simplicity in this script
# Ideally, define logic in settings.py but I'll use relative here to be safe
# Go up to 'backend' directory
# Current: .../backend/server/crime_api/services/data_sync.py
# 1. services
# 2. crime_api
# 3. server
# 4. backend
BASE_SERVER_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
BACKEND_ROOT = os.path.dirname(BASE_SERVER_DIR)
# Data is in backend/data
CSV_PATH = os.path.join(BACKEND_ROOT, 'data', 'processed', 'crime_ml_ready_multi_year_cleaned.csv')

def sync_db_to_csv():
    """
    Exports all CrimeRecord entries to CSV, then triggers ML reload.
    """
    print("Syncing DB to CSV...")
    
    # query all
    qs = CrimeRecord.objects.all().values(
        'year', 'month', 'district', 'police_division', 'crime_type', 'crime_count'
    )
    
    df = pd.DataFrame(list(qs))
    
    if df.empty:
        print("Warning: DB is empty, skipping sync to avoid overwriting CSV with empty data.")
        return
    
    # Re-calculate risk_zone and trend?
    # For now, we might leave them empty or compute simple logic.
    # The ML model reload reads raw 'crime_count' to predict risk_zone, BUT the CSV structure 
    # expected by 'load_resources' (and subsequent ML training sequences) needs 
    # consistent columns.
    # Does 'load_resources' use risk_zone/trend from CSV?
    # views.py -> load_resources:
    # df_local = pd.read_csv(CSV_PATH)
    # df_local["year"]...
    # It doesn't seemingly use 'risk_zone' column for *training* inside views (views uses pre-trained model).
    # But 'risk_by_district' API returns 'risk_zone' from the DF directly for Historical.
    # So we MUST generate 'risk_zone' column if we want historical data to show risk.
    
    # Logic for Risk Zone (Quantile/Threshold based on count)
    try:
        # Calculate risk_zone more intelligently:
        # For each year-month-crime_type combination, calculate quantiles across districts
        # This way, adding new data will properly show as High/Medium/Low relative to other districts in same period
        
        def calc_risk_smart(group_df):
            """Calculate risk zone for a group of records (same year, month, crime_type)"""
            counts = group_df['crime_count']
            
            # Hybrid approach: Use absolute thresholds first, then relative percentiles
            try:
                def assign_risk(count):
                    # Absolute thresholds first (prevents low numbers from being "High")
                    if count < 3:
                        return "Low"
                    
                    # If only one record, use absolute thresholds only
                    if len(counts) < 2:
                        if count >= 50:
                            return "High"
                        elif count >= 15:
                            return "Medium"
                        else:
                            return "Low"
                    
                    # Multiple records: use percentiles too
                    q75 = counts.quantile(0.75)
                    q90 = counts.quantile(0.90)
                    max_count = counts.max()
                    
                    if count < 10:
                        # For low-to-medium counts, check relative position
                        if count >= q75 and max_count >= 15:
                            return "Medium"
                        else:
                            return "Low"
                    elif count < 25:
                        # Medium range - check relative position
                        if count >= q90:
                            return "High"
                        elif count >= q75:
                            return "Medium"
                        else:
                            return "Low"
                    else:
                        # High absolute count (>= 25)
                        if count >= q90:
                            return "High"
                        elif count >= q75:
                            return "Medium"
                        else:
                            return "Low"
                
                return counts.apply(assign_risk)
            except:
                return pd.Series(["Low"] * len(group_df), index=group_df.index)
        
        # Group by year, month, and crime_type to calculate relative risk
        df["risk_zone"] = df.groupby(["year", "month", "crime_type"], group_keys=False).apply(
            lambda g: calc_risk_smart(g)
        )
        
    except Exception as e:
        print(f"Risk calc error: {e}")
        df["risk_zone"] = "Low"
        
    df["trend"] = "Stable" # Placeholder
    
    # Fill missing columns expected by ML if any?
    
    # Save to CSV
    df.to_csv(CSV_PATH, index=False)
    print(f"CSV updated at {CSV_PATH}")
    print(f"Total records synced: {len(df)}")
    print(f"Sample: {df.head(3).to_dict('records')}")
    
    # Trigger Hot Reload
    reload_ml_data_internal()
    print("ML Data Reloaded.")
