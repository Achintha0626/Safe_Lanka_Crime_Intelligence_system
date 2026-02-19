"""
Train Crime Forecast Model using cleaned dataset

This script trains a machine learning model to predict crime counts
using the cleaned multi-year crime dataset with only 25 official districts.
"""

import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Paths
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BACKEND_ROOT, "data", "processed", "crime_ml_ready_multi_year_cleaned.csv")
MODEL_OUTPUT_PATH = os.path.join(BACKEND_ROOT, "server", "ml_models", "crime_forecast_model.pkl")

print("=" * 60)
print("CRIME FORECAST MODEL TRAINING")
print("=" * 60)

# Load cleaned data
print(f"\n1. Loading cleaned dataset from:")
print(f"   {DATA_PATH}")
df = pd.read_csv(DATA_PATH)

print(f"\n   Dataset shape: {df.shape}")
print(f"   Rows: {len(df):,}")
print(f"   Unique districts: {df['district'].nunique()}")
print(f"   Unique crime types: {df['crime_type'].nunique()}")

# Prepare features
print("\n2. Preparing features...")

# Sort data to compute lag features
df = df.sort_values(['district', 'police_division', 'crime_type', 'year', 'month']).reset_index(drop=True)

# Create lag features (previous month's crime count)
df['lag_1'] = df.groupby(['district', 'police_division', 'crime_type'])['crime_count'].shift(1)
df['lag_2'] = df.groupby(['district', 'police_division', 'crime_type'])['crime_count'].shift(2)

# Rolling mean features
df['roll3_mean'] = df.groupby(['district', 'police_division', 'crime_type'])['crime_count'].transform(
    lambda x: x.rolling(window=3, min_periods=1).mean().shift(1)
)
df['roll6_mean'] = df.groupby(['district', 'police_division', 'crime_type'])['crime_count'].transform(
    lambda x: x.rolling(window=6, min_periods=1).mean().shift(1)
)

# Drop rows with NaN in lag features (first few months per group)
df_clean = df.dropna(subset=['lag_1', 'lag_2', 'roll3_mean', 'roll6_mean']).copy()

print(f"   After creating lag features: {len(df_clean):,} rows")

# Define features and target
feature_cols = ['year', 'month', 'district', 'police_division', 'crime_type', 
                'lag_1', 'lag_2', 'roll3_mean', 'roll6_mean']
target_col = 'crime_count'

X = df_clean[feature_cols]
y = df_clean[target_col]

print(f"\n3. Feature columns: {feature_cols}")
print(f"   Target column: {target_col}")

# Split data
print("\n4. Splitting data (80% train, 20% test)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"   Training set: {len(X_train):,} samples")
print(f"   Test set: {len(X_test):,} samples")

# Preprocessing: One-hot encode categorical columns
categorical_features = ['district', 'police_division', 'crime_type']
numerical_features = ['year', 'month', 'lag_1', 'lag_2', 'roll3_mean', 'roll6_mean']

print(f"\n5. Creating preprocessing pipeline...")
print(f"   Categorical features: {categorical_features}")
print(f"   Numerical features: {numerical_features}")

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
        ('num', 'passthrough', numerical_features)
    ]
)

# Train model
print("\n6. Training Random Forest model...")
print("   This may take several minutes...")

from sklearn.pipeline import Pipeline

model_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
        verbose=1
    ))
])

model_pipeline.fit(X_train, y_train)

# Evaluate
print("\n7. Evaluating model...")
y_pred_train = model_pipeline.predict(X_train)
y_pred_test = model_pipeline.predict(X_test)

train_mae = mean_absolute_error(y_train, y_pred_train)
test_mae = mean_absolute_error(y_test, y_pred_test)
train_r2 = r2_score(y_train, y_pred_train)
test_r2 = r2_score(y_test, y_pred_test)

print(f"\n   Training Metrics:")
print(f"   - MAE: {train_mae:.2f}")
print(f"   - R² Score: {train_r2:.4f}")

print(f"\n   Test Metrics:")
print(f"   - MAE: {test_mae:.2f}")
print(f"   - R² Score: {test_r2:.4f}")

# Save model
print(f"\n8. Saving model to:")
print(f"   {MODEL_OUTPUT_PATH}")

os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
joblib.dump(model_pipeline, MODEL_OUTPUT_PATH)

print("\n" + "=" * 60)
print("✓ MODEL TRAINING COMPLETE!")
print("=" * 60)

# Print sample predictions
print("\n9. Sample predictions (first 5 test samples):")
sample_results = pd.DataFrame({
    'Actual': y_test.head(),
    'Predicted': y_pred_test[:5],
    'Error': abs(y_test.head().values - y_pred_test[:5])
})
print(sample_results.to_string(index=False))

print("\n✓ Model is ready to use!")
print(f"\nModel info:")
print(f"  - Districts: 25 official Sri Lankan districts")
print(f"  - Features: {len(feature_cols)}")
print(f"  - Training samples: {len(X_train):,}")
print(f"  - Scikit-learn version: {__import__('sklearn').__version__}")
