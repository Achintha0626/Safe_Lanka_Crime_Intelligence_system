from django.shortcuts import render  # optional
import os
import pandas as pd
import joblib
import numpy as np

from rest_framework.decorators import api_view
from rest_framework.response import Response


# =========================
# Paths
# =========================
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

CSV_PATH = os.path.join(
    BACKEND_ROOT, "data", "processed", "crime_ml_ready_multi_year_cleaned.csv"
)

MODEL_PATH = os.path.join(
    BACKEND_ROOT, "server", "ml_models", "crime_forecast_model.pkl"
)

# =========================
# Global State & Loading
# =========================
df = None
model = None

def load_resources():
    global df, model
    print("Loading ML resources...")
    try:
        df_local = pd.read_csv(CSV_PATH)
        # Make sure types are correct
        df_local["year"] = df_local["year"].astype(int)
        df_local["month"] = df_local["month"].astype(int)
        df_local["crime_count"] = df_local["crime_count"].astype(float)
        
        df = df_local
        model = joblib.load(MODEL_PATH)
        print("ML resources loaded successfully.")
    except Exception as e:
        print(f"Error loading ML resources: {e}")

# Initial load
load_resources()

def reload_ml_data_internal():
    """
    Internal hook to reload data. 
    Can be called by signals or other views.
    """
    load_resources()

# =========================
# Helpers
# =========================
def compute_features_for_row(data_sorted: pd.DataFrame, year: int, month: int):
    """
    data_sorted must already be filtered to one district+division+crime_type
    and sorted by year, month.
    """
    row = data_sorted[(data_sorted["year"] == year) & (data_sorted["month"] == month)]
    if row.empty:
        return None, "No matching row for given year+month"

    idx = row.index[0]
    history = data_sorted.loc[data_sorted.index < idx]

    # Need enough history to create lag and rolling features
    if len(history) < 6:
        return None, "Not enough history (need at least 6 previous rows)"

    lag_1 = float(history.tail(1)["crime_count"].values[0])
    lag_2 = float(history.tail(2).head(1)["crime_count"].values[0])
    roll3_mean = float(history.tail(3)["crime_count"].mean())
    roll6_mean = float(history.tail(6)["crime_count"].mean())

    feats = {
        "lag_1": lag_1,
        "lag_2": lag_2,
        "roll3_mean": roll3_mean,
        "roll6_mean": roll6_mean,
    }
    return feats, None


# =========================
# APIs
# =========================
@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["GET"])
def metadata(request):
    if df is None:
        return Response({"error": "Data not loaded"}, status=503)
        
    years = sorted(df["year"].unique().tolist())
    months = sorted(df["month"].unique().tolist())
    crime_types = sorted(df["crime_type"].unique().tolist())
    districts = sorted(df["district"].unique().tolist())
    # Handle mixed types (str vs nan float)
    police_divisions = sorted(df["police_division"].dropna().astype(str).unique().tolist())

    # List of 25 administrative districts of Sri Lanka
    administrative_districts = [
        "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
        "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
        "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
        "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
        "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
    ]

    return Response({
        "years": years,
        "months": months,
        "crime_types": crime_types,
        "districts": districts,
        "police_divisions": police_divisions,
        "administrative_districts": administrative_districts,
    })


@api_view(["GET"])
def risk_by_district(request):
    """
    Historical risk zone by district (filtered by year/month/crime_type)
    NOTE: This returns MODE risk_zone (most common). Good for demo.
    """
    if df is None:
        return Response({"error": "Data not loaded"}, status=503)

    year = request.GET.get("year")
    month = request.GET.get("month")
    crime_type = request.GET.get("crime_type")

    data = df.copy()

    if year:
        data = data[data["year"] == int(year)]
    if month:
        data = data[data["month"] == int(month)]
    if crime_type:
        data = data[data["crime_type"] == crime_type]

    result = (
        data.groupby("district")["risk_zone"]
        .agg(lambda x: x.value_counts().index[0] if len(x) else "Low")
        .to_dict()
    )

    return Response(result)


@api_view(["GET"])
def crime_count_by_district(request):
    """
    Historical heatmap intensity (recommended for maps)
    Returns sum(crime_count) per district for the selected filters.
    """
    if df is None:
        return Response({"error": "Data not loaded"}, status=503)

    year = request.GET.get("year")
    month = request.GET.get("month")
    crime_type = request.GET.get("crime_type")

    data = df.copy()

    if year:
        data = data[data["year"] == int(year)]
    if month:
        data = data[data["month"] == int(month)]
    if crime_type:
        data = data[data["crime_type"] == crime_type]

    result = (
        data.groupby("district")["crime_count"]
        .sum()
        .to_dict()
    )

    return Response(result)


@api_view(["GET"])
def predict_next_crime(request):
    """
    Predict NEXT month crime_count for one district + police_division + crime_type.
    Example:
    /api/predict-next-crime?year=2024&month=12&district=Ampara&police_division=Ampara%20Main&crime_type=Total%20Crimes
    """
    if df is None or model is None:
        return Response({"error": "Model/Data not loaded"}, status=503)

    try:
        year = request.GET.get("year")
        month = request.GET.get("month")
        district = request.GET.get("district")
        police_division = request.GET.get("police_division")
        crime_type = request.GET.get("crime_type")

        if not all([year, month, district, police_division, crime_type]):
            return Response({
                "error": "Missing params. Required: year, month, district, police_division, crime_type"
            }, status=400)

        year = int(year)
        month = int(month)

        # Filter to the series we want to predict for
        data = df[
            (df["district"] == district) &
            (df["police_division"] == police_division) &
            (df["crime_type"] == crime_type)
        ].sort_values(["year", "month"])

        if data.empty:
            return Response({"error": "No data found for given district/police_division/crime_type"}, status=400)

        feats, err = compute_features_for_row(data, year, month)
        if err:
            return Response({"error": err}, status=400)

        X_input = pd.DataFrame([{
            "year": year,
            "month": month,
            "district": district,
            "police_division": police_division,
            "crime_type": crime_type,
            "lag_1": feats["lag_1"],
            "lag_2": feats["lag_2"],
            "roll3_mean": feats["roll3_mean"],
            "roll6_mean": feats["roll6_mean"],
        }])

        pred = float(model.predict(X_input)[0])

        return Response({
            "district": district,
            "police_division": police_division,
            "crime_type": crime_type,
            "year": year,
            "month": month,
            "predicted_next_crime_count": round(pred, 2)
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def predict_risk_by_district(request):
    """
    Predict next-month risk_zone per district for a given:
    year, month, police_division(optional), crime_type

    Example:
    /api/predict-risk-by-district/?year=2024&month=12&crime_type=Total%20Crimes
    """
    if df is None:
        return Response({"error": "Data not loaded"}, status=503)

    year = request.GET.get("year")
    month = request.GET.get("month")
    crime_type = request.GET.get("crime_type")
    police_division = request.GET.get("police_division")  # optional

    if not all([year, month, crime_type]):
        return Response({"error": "Missing params: year, month, crime_type"}, status=400)

    year = int(year)
    month = int(month)

    data = df.copy()
    data = data[data["crime_type"] == crime_type]

    if police_division:
        data = data[data["police_division"] == police_division]

    # Predict for each district (using the row for that year/month + compute lags)
    preds = []
    for district in sorted(data["district"].unique()):
        series = data[data["district"] == district].sort_values(["year", "month"])
        feats, err = compute_features_for_row(series, year, month)
        if err:
            # skip districts without enough history
            continue

        X_input = pd.DataFrame([{
            "year": year,
            "month": month,
            "district": district,
            "police_division": series["police_division"].iloc[0],
            "crime_type": crime_type,
            "lag_1": feats["lag_1"],
            "lag_2": feats["lag_2"],
            "roll3_mean": feats["roll3_mean"],
            "roll6_mean": feats["roll6_mean"],
        }])

        pred = float(model.predict(X_input)[0])
        preds.append({"district": district, "pred": pred})

    if not preds:
        return Response({"error": "No predictions (not enough history for selected filters)"}, status=400)

    pred_df = pd.DataFrame(preds)

    # Split into Low/Medium/High based on predicted values
    pred_df["risk_zone"] = pd.qcut(pred_df["pred"], q=3, labels=["Low", "Medium", "High"])

    result = dict(zip(pred_df["district"], pred_df["risk_zone"].astype(str)))
    return Response(result)


@api_view(["GET"])
def predict_risk_year(request):
    """
    Predict risk_zone per district for all 12 months of a future year.

    Example:
    /api/predict-risk-year/?year=2025&crime_type=Total%20Crimes
    Optional: &police_division=Ampara%20Main
    """
    if df is None:
        return Response({"error": "Data not loaded"}, status=503)

    year = request.GET.get("year")
    crime_type = request.GET.get("crime_type")
    police_division = request.GET.get("police_division")  # optional

    if not all([year, crime_type]):
        return Response({"error": "Missing params: year, crime_type"}, status=400)

    year = int(year)

    data = df.copy()
    data = data[data["crime_type"] == crime_type]
    if police_division:
        data = data[data["police_division"] == police_division]

    districts = sorted(data["district"].unique())

    # We will generate predictions month-by-month
    output = {}

    for m in range(1, 13):
        preds = []
        for district in districts:
            series = data[data["district"] == district].sort_values(["year", "month"])
            if series.empty:
                continue

            # Use last known history from dataset to build lag features
            # Take last 6 rows as "history"
            hist = series.tail(6)
            if len(hist) < 6:
                continue

            lag_1 = float(hist.tail(1)["crime_count"].values[0])
            lag_2 = float(hist.tail(2).head(1)["crime_count"].values[0])
            roll3_mean = float(hist.tail(3)["crime_count"].mean())
            roll6_mean = float(hist["crime_count"].mean())

            # Use a police_division value (first one)
            pdv = series["police_division"].iloc[0]

            X_input = pd.DataFrame([{
                "year": year,
                "month": m,
                "district": district,
                "police_division": pdv,
                "crime_type": crime_type,
                "lag_1": lag_1,
                "lag_2": lag_2,
                "roll3_mean": roll3_mean,
                "roll6_mean": roll6_mean,
            }])

            pred = float(model.predict(X_input)[0])
            preds.append({"district": district, "pred": pred})

        if not preds:
            output[str(m)] = {}
            continue

        pred_df = pd.DataFrame(preds)

        # Split into Low/Medium/High for THIS month
        pred_df["risk_zone"] = pd.qcut(pred_df["pred"], q=3, labels=["Low", "Medium", "High"])

        output[str(m)] = dict(zip(pred_df["district"], pred_df["risk_zone"].astype(str)))

    return Response({
        "year": year,
        "crime_type": crime_type,
        "months": output
    })


@api_view(["GET"])
def predict_risk_year_detailed(request):
    """
    More realistic rolling forecast + returns predicted counts & risk zones & explanations.
    OPTIMIZED: Batches predictions for faster performance.

    Example:
    /api/predict-risk-year-detailed/?year=2025&crime_type=Total%20Crimes
    """
    if df is None:
        return Response({"error": "Data not loaded"}, status=503)

    year = request.GET.get("year")
    crime_type = request.GET.get("crime_type")
    police_division = request.GET.get("police_division")  # optional

    if not all([year, crime_type]):
        return Response({"error": "Missing params: year, crime_type"}, status=400)

    year = int(year)

    data = df.copy()
    data = data[data["crime_type"] == crime_type]
    if police_division:
        data = data[data["police_division"] == police_division]

    districts = sorted(data["district"].unique())

    # Prepare all district data and histories
    district_data = {}
    for district in districts:
        series = data[data["district"] == district].sort_values(["year", "month"])
        if series.empty:
            continue

        pdv = series["police_division"].iloc[0]
        district_mean = series["crime_count"].mean()
        hist = series["crime_count"].tail(6).astype(float).tolist()
        
        if len(hist) < 6:
            continue
            
        district_data[district] = {
            "police_division": pdv,
            "district_mean": district_mean,
            "history": hist.copy()
        }

    # Prepare batch predictions for all districts and months
    monthly_preds = {str(m): {} for m in range(1, 13)}
    
    for m in range(1, 13):
        # Collect all predictions for this month in a batch
        batch_inputs = []
        batch_districts = []
        
        for district, dinfo in district_data.items():
            hist = dinfo["history"]
            lag_1 = float(hist[-1])
            lag_2 = float(hist[-2])
            roll3_mean = float(sum(hist[-3:]) / 3.0)
            roll6_mean = float(sum(hist[-6:]) / 6.0)

            batch_inputs.append({
                "year": year,
                "month": m,
                "district": district,
                "police_division": dinfo["police_division"],
                "crime_type": crime_type,
                "lag_1": lag_1,
                "lag_2": lag_2,
                "roll3_mean": roll3_mean,
                "roll6_mean": roll6_mean,
            })
            batch_districts.append(district)
        
        # Make batch prediction (all districts at once)
        if batch_inputs:
            X_batch = pd.DataFrame(batch_inputs)
            predictions = model.predict(X_batch)
            
            # Process predictions for each district
            for i, district in enumerate(batch_districts):
                pred = float(predictions[i])
                pred_rounded = round(pred, 2)
                dinfo = district_data[district]
                hist = dinfo["history"]
                district_mean = dinfo["district_mean"]
                lag_1 = float(hist[-1])
                
                # Determine trend
                trend = "stable"
                if pred > lag_1 * 1.1:
                    trend = "increasing"
                elif pred < lag_1 * 0.9:
                    trend = "decreasing"

                # Store prediction (explanation will be added after risk zones are calculated)
                monthly_preds[str(m)][district] = {
                    "predicted_crime_count": pred_rounded,
                    "police_division": dinfo["police_division"],
                    "trend": trend,
                    "district_avg": round(district_mean, 1)
                }
                
                # Update rolling history for next month
                dinfo["history"].append(pred)
                dinfo["history"] = dinfo["history"][-6:]

    # Convert numeric predictions -> risk zones per month using qcut
    output_months = {}
    for m in range(1, 13):
        mkey = str(m)
        if not monthly_preds[mkey]:
            output_months[mkey] = {}
            continue

        tmp = pd.DataFrame([
            {"district": d, "pred": monthly_preds[mkey][d]["predicted_crime_count"]}
            for d in monthly_preds[mkey].keys()
        ])

        # Try qcut for equal-sized bins, fallback to rank-based if it fails
        try:
            if tmp["pred"].nunique() >= 3:
                tmp["risk_zone"] = pd.qcut(tmp["pred"], q=3, labels=["Low", "Medium", "High"], duplicates='drop').astype(str)
            else:
                raise ValueError("Not enough unique values")
        except (ValueError, TypeError):
            # Fallback: rank-based assignment for cases with duplicate values or edge cases
            tmp = tmp.sort_values("pred").reset_index(drop=True)
            n = len(tmp)
            def fallback_zone(i):
                if i >= int(n * 2/3): return "High"
                if i >= int(n * 1/3): return "Medium"
                return "Low"
            tmp["risk_zone"] = [fallback_zone(i) for i in range(n)]

        # Apply absolute thresholds: cap risk zones for very low predicted counts
        # This prevents "High" risk for rare crimes with near-zero predictions
        max_pred = tmp["pred"].max()
        avg_pred = tmp["pred"].mean()
        
        def apply_absolute_threshold(row):
            pred = row["pred"]
            zone = row["risk_zone"]
            
            # If all predictions are very low (rare crime), cap at Low
            if max_pred < 2.0:
                return "Low"
            
            # If this prediction is < 2.0 crimes, cap at Low regardless of relative position
            if pred < 2.0:
                return "Low"
            
            # If prediction is < 5.0 crimes, cap at Medium (prevent High for low absolute counts)
            if pred < 5.0 and zone == "High":
                return "Medium"
            
            return zone
        
        tmp["risk_zone"] = tmp.apply(apply_absolute_threshold, axis=1)
        risk_map = dict(zip(tmp["district"], tmp["risk_zone"]))

        # Generate risk-zone-specific explanations
        def generate_explanation(risk_zone, pred_count, trend, district_avg):
            """Generate actionable explanation based on risk zone."""
            if risk_zone == "High":
                message = "Crime activity is expected to be higher than normal in this area during this period. Increased patrol presence and preventive measures are recommended."
            elif risk_zone == "Medium":
                message = "Crime activity is within normal range but should be monitored. Maintain routine patrol coverage."
            else:  # Low
                message = "Crime activity is expected to remain low during this period. No additional deployment required."
            
            return f"{message}\n\nPredicted: {pred_count} cases | Trend: {trend} | District avg: {district_avg}"

        # merge risk_zone back in with enhanced explanations
        merged = {}
        for d, payload in monthly_preds[mkey].items():
            risk_zone = risk_map.get(d, "Low")
            explanation = generate_explanation(
                risk_zone,
                payload["predicted_crime_count"],
                payload["trend"],
                payload["district_avg"]
            )
            
            merged[d] = {
                "predicted_crime_count": payload["predicted_crime_count"],
                "risk_zone": risk_zone,
                "police_division": payload["police_division"],
                "explanation": explanation,
                "trend": payload["trend"],
            }

        output_months[mkey] = merged

    return Response({
        "year": year,
        "crime_type": crime_type,
        "months": output_months
    })


@api_view(["GET"])
def predict_risk(request):
    """
    Predict risk for a specific district on a specific date.
    Used by Police Dashboard for patrol planning.
    
    Example:
    /api/predict-risk/?district=Colombo&date=2027-01-16
    
    Returns:
    {
        "risk": "High" | "Medium" | "Low",
        "predicted_count": float,
        "trend": "Increasing" | "Stable" | "Decreasing",
        "top_crime_types": ["Theft", "Assault", ...]
    }
    """
    if df is None or model is None:
        return Response({"error": "Data or model not loaded"}, status=503)
        
    district = request.GET.get("district")
    date_str = request.GET.get("date")
    
    if not district or not date_str:
        return Response({"error": "Missing params: district, date"}, status=400)
    
    try:
        # Parse date to extract year and month
        from datetime import datetime
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        year = date_obj.year
        month = date_obj.month
    except ValueError:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
    
    # Get all crime types for this district
    data = df.copy()
    data = data[data["district"] == district]
    
    if data.empty:
        return Response({"error": f"No data for district: {district}"}, status=404)
    
    crime_types = data["crime_type"].unique()
    predictions = []
    
    # Predict for each crime type
    for crime_type in crime_types:
        crime_data = data[data["crime_type"] == crime_type].sort_values(["year", "month"])
        
        # Check if we have enough historical data (at least 6 months)
        if len(crime_data) < 6:
            continue
        
        # Get the most recent row to compute features
        latest_row = crime_data.iloc[-1]
        latest_year = int(latest_row["year"])
        latest_month = int(latest_row["month"])
        
        # Compute features based on historical data
        lag_1 = float(crime_data.tail(1)["crime_count"].values[0])
        lag_2 = float(crime_data.tail(2).head(1)["crime_count"].values[0]) if len(crime_data) >= 2 else lag_1
        roll3_mean = float(crime_data.tail(3)["crime_count"].mean())
        roll6_mean = float(crime_data.tail(6)["crime_count"].mean())
        
        # Get police division
        police_div = latest_row["police_division"] if pd.notna(latest_row["police_division"]) else "Unknown"
        
        # Prepare input for model (using target year/month for prediction)
        X_input = pd.DataFrame([{
            "year": year,
            "month": month,
            "district": district,
            "police_division": police_div,
            "crime_type": crime_type,
            "lag_1": lag_1,
            "lag_2": lag_2,
            "roll3_mean": roll3_mean,
            "roll6_mean": roll6_mean,
        }])
        
        # Make prediction
        pred = float(model.predict(X_input)[0])
        
        # Calculate trend
        if pred > lag_1 * 1.1:
            trend = "Increasing"
        elif pred < lag_1 * 0.9:
            trend = "Decreasing"
        else:
            trend = "Stable"
        
        predictions.append({
            "crime_type": crime_type,
            "predicted_count": max(0, pred),
            "trend": trend
        })
    
    if not predictions:
        return Response({"error": "Cannot generate predictions - insufficient historical data"}, status=400)
    
    # Calculate total predicted crimes
    total_predicted = sum(p["predicted_count"] for p in predictions)
    
    # Sort by predicted count to get top crime types
    predictions.sort(key=lambda x: x["predicted_count"], reverse=True)
    top_crime_types = [p["crime_type"] for p in predictions[:3]]
    
    # Determine overall risk zone based on total predicted count
    # Using thresholds (can be adjusted based on your data)
    if total_predicted >= 50:
        risk = "High"
    elif total_predicted >= 20:
        risk = "Medium"
    else:
        risk = "Low"
    
    # Determine overall trend (based on most common trend)
    trends = [p["trend"] for p in predictions]
    trend_counts = {
        "Increasing": trends.count("Increasing"),
        "Decreasing": trends.count("Decreasing"),
        "Stable": trends.count("Stable")
    }
    overall_trend = max(trend_counts, key=trend_counts.get)
    
    return Response({
        "risk": risk,
        "predicted_count": round(total_predicted, 1),
        "trend": overall_trend,
        "top_crime_types": top_crime_types,
        "district": district,
        "date": date_str
    })
