"""
train_anomaly.py
Run this script once to train and save the Isolation Forest anomaly detection models.
Place this file in backend/hazard-ai/ and run: python train_anomaly.py

The models learn what NORMAL sensor readings look like.
Any reading that deviates significantly gets flagged as anomalous.
"""

import numpy as np
import joblib
import os
from sklearn.ensemble import IsolationForest

base_dir = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# FLOOD NODE — normal readings
# water: 0–15% (dry to slightly damp sensor)
# distance: 30–400 cm (canal far from flooding level)
# ---------------------------------------------------------------------------
np.random.seed(42)
n = 2000

flood_normal = np.column_stack([
    np.random.uniform(0, 15, n),       # water % — dry to slightly damp
    np.random.uniform(30, 400, n),     # distance cm — canal not rising
])

flood_detector = IsolationForest(
    n_estimators=200,
    contamination=0.05,   # expect ~5% of training data might be edge cases
    random_state=42
)
flood_detector.fit(flood_normal)

os.makedirs(os.path.join(base_dir, 'flood'), exist_ok=True)
joblib.dump(flood_detector, os.path.join(base_dir, 'flood/anomaly_model.pkl'))
print("Flood anomaly model saved.")

# ---------------------------------------------------------------------------
# FIRE NODE — normal readings
# smoke: 45–84 ppm (background MQ-2 ADC in open air)
# temperature: 25–35 °C (normal outdoor temperature range)
# ---------------------------------------------------------------------------
fire_normal = np.column_stack([
    np.random.uniform(45, 84, n),      # smoke ppm — ambient air
    np.random.uniform(25, 35, n),      # temperature °C — normal outdoor
])

fire_detector = IsolationForest(
    n_estimators=200,
    contamination=0.05,
    random_state=42
)
fire_detector.fit(fire_normal)

os.makedirs(os.path.join(base_dir, 'fire'), exist_ok=True)
joblib.dump(fire_detector, os.path.join(base_dir, 'fire/anomaly_model.pkl'))
print("Fire anomaly model saved.")

# ---------------------------------------------------------------------------
# EARTHQUAKE NODE — normal readings
# vibration: 0.0–0.8 normalized (resting surface, minor footstep vibrations)
# ---------------------------------------------------------------------------
earthquake_normal = np.column_stack([
    np.random.uniform(0.0, 0.8, n),    # normalized vibration — resting
])

earthquake_detector = IsolationForest(
    n_estimators=200,
    contamination=0.05,
    random_state=42
)
earthquake_detector.fit(earthquake_normal)

os.makedirs(os.path.join(base_dir, 'earthquake'), exist_ok=True)
joblib.dump(earthquake_detector, os.path.join(base_dir, 'earthquake/anomaly_model.pkl'))
print("Earthquake anomaly model saved.")

print("\nAll anomaly detection models trained and saved successfully.")
print("Anomaly score interpretation:")
print("  score < -0.1  = anomalous (unusual reading, potential pre-hazard)")
print("  score >= -0.1 = normal")