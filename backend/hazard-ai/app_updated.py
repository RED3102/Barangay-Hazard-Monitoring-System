from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

base_dir = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# Load Random Forest classifiers
# ---------------------------------------------------------------------------
flood_model      = joblib.load(os.path.join(base_dir, 'flood/flood_model.pkl'))
fire_model       = joblib.load(os.path.join(base_dir, 'fire/fire_model.pkl'))
earthquake_model = joblib.load(os.path.join(base_dir, 'earthquake/earthquake_model.pkl'))

# ---------------------------------------------------------------------------
# Load Isolation Forest anomaly detectors
# ---------------------------------------------------------------------------
flood_anomaly      = joblib.load(os.path.join(base_dir, 'flood/anomaly_model.pkl'))
fire_anomaly       = joblib.load(os.path.join(base_dir, 'fire/anomaly_model.pkl'))
earthquake_anomaly = joblib.load(os.path.join(base_dir, 'earthquake/anomaly_model.pkl'))

# ---------------------------------------------------------------------------
# Hazard classification endpoints (Random Forest)
# ---------------------------------------------------------------------------
@app.route('/classify/flood', methods=['POST'])
def classify_flood():
    data     = request.json
    water    = data.get('water', 0)
    distance = data.get('distance', 999)
    result   = flood_model.predict([[water, distance]])[0]
    return jsonify({ 'hazard': result })

@app.route('/classify/fire', methods=['POST'])
def classify_fire():
    data        = request.json
    smoke       = data.get('smoke', 0)
    temperature = data.get('temperature', 0)
    result      = fire_model.predict([[smoke, temperature]])[0]
    return jsonify({ 'hazard': result })

@app.route('/classify/earthquake', methods=['POST'])
def classify_earthquake():
    data      = request.json
    vibration = data.get('vibration', 0)
    result    = earthquake_model.predict([[vibration]])[0]
    return jsonify({ 'hazard': result })

# ---------------------------------------------------------------------------
# Anomaly detection endpoints (Isolation Forest)
# Returns:
#   anomaly: true/false
#   score: float (lower = more anomalous, < -0.1 is flagged)
#   severity: "normal" | "unusual" | "anomalous"
# ---------------------------------------------------------------------------

def interpret_score(score):
    """Convert raw Isolation Forest score to a readable severity level."""
    if score < -0.2:
        return "anomalous"
    elif score < -0.1:
        return "unusual"
    else:
        return "normal"

@app.route('/anomaly/flood', methods=['POST'])
def anomaly_flood():
    data     = request.json
    water    = float(data.get('water', 0))
    distance = float(data.get('distance', 999))

    features = np.array([[water, distance]])
    score    = float(flood_anomaly.decision_function(features)[0])
    pred     = int(flood_anomaly.predict(features)[0])  # -1 = anomaly, 1 = normal
    is_anomaly = pred == -1

    return jsonify({
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score),
        'inputs':   { 'water': water, 'distance': distance }
    })

@app.route('/anomaly/fire', methods=['POST'])
def anomaly_fire():
    data        = request.json
    smoke       = float(data.get('smoke', 0))
    temperature = float(data.get('temperature', 0))

    features   = np.array([[smoke, temperature]])
    score      = float(fire_anomaly.decision_function(features)[0])
    pred       = int(fire_anomaly.predict(features)[0])
    is_anomaly = pred == -1

    return jsonify({
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score),
        'inputs':   { 'smoke': smoke, 'temperature': temperature }
    })

@app.route('/anomaly/earthquake', methods=['POST'])
def anomaly_earthquake():
    data      = request.json
    vibration = float(data.get('vibration', 0))

    features   = np.array([[vibration]])
    score      = float(earthquake_anomaly.decision_function(features)[0])
    pred       = int(earthquake_anomaly.predict(features)[0])
    is_anomaly = pred == -1

    return jsonify({
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score),
        'inputs':   { 'vibration': vibration }
    })

# ---------------------------------------------------------------------------
# Combined endpoint — classify + anomaly in one call
# Used by the backend after saving a reading
# ---------------------------------------------------------------------------
@app.route('/analyze/flood', methods=['POST'])
def analyze_flood():
    data     = request.json
    water    = float(data.get('water', 0))
    distance = float(data.get('distance', 999))
    features = np.array([[water, distance]])

    hazard    = flood_model.predict(features)[0]
    score     = float(flood_anomaly.decision_function(features)[0])
    is_anomaly = flood_anomaly.predict(features)[0] == -1

    return jsonify({
        'hazard':   hazard,
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score)
    })

@app.route('/analyze/fire', methods=['POST'])
def analyze_fire():
    data        = request.json
    smoke       = float(data.get('smoke', 0))
    temperature = float(data.get('temperature', 0))
    features    = np.array([[smoke, temperature]])

    hazard     = fire_model.predict(features)[0]
    score      = float(fire_anomaly.decision_function(features)[0])
    is_anomaly = fire_anomaly.predict(features)[0] == -1

    return jsonify({
        'hazard':   hazard,
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score)
    })

@app.route('/analyze/earthquake', methods=['POST'])
def analyze_earthquake():
    data      = request.json
    vibration = float(data.get('vibration', 0))
    features  = np.array([[vibration]])

    hazard     = earthquake_model.predict(features)[0]
    score      = float(earthquake_anomaly.decision_function(features)[0])
    is_anomaly = earthquake_anomaly.predict(features)[0] == -1

    return jsonify({
        'hazard':   hazard,
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score)
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
    from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

base_dir = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# Load Random Forest classifiers
# ---------------------------------------------------------------------------
flood_model      = joblib.load(os.path.join(base_dir, 'flood/flood_model.pkl'))
fire_model       = joblib.load(os.path.join(base_dir, 'fire/fire_model.pkl'))
earthquake_model = joblib.load(os.path.join(base_dir, 'earthquake/earthquake_model.pkl'))

# ---------------------------------------------------------------------------
# Load Isolation Forest anomaly detectors
# ---------------------------------------------------------------------------
flood_anomaly      = joblib.load(os.path.join(base_dir, 'flood/anomaly_model.pkl'))
fire_anomaly       = joblib.load(os.path.join(base_dir, 'fire/anomaly_model.pkl'))
earthquake_anomaly = joblib.load(os.path.join(base_dir, 'earthquake/anomaly_model.pkl'))

# ---------------------------------------------------------------------------
# Hazard classification endpoints (Random Forest)
# ---------------------------------------------------------------------------
@app.route('/classify/flood', methods=['POST'])
def classify_flood():
    data     = request.json
    water    = data.get('water', 0)
    distance = data.get('distance', 999)
    result   = flood_model.predict([[water, distance]])[0]
    return jsonify({ 'hazard': result })

@app.route('/classify/fire', methods=['POST'])
def classify_fire():
    data        = request.json
    smoke       = data.get('smoke', 0)
    temperature = data.get('temperature', 0)
    result      = fire_model.predict([[smoke, temperature]])[0]
    return jsonify({ 'hazard': result })

@app.route('/classify/earthquake', methods=['POST'])
def classify_earthquake():
    data      = request.json
    vibration = data.get('vibration', 0)
    result    = earthquake_model.predict([[vibration]])[0]
    return jsonify({ 'hazard': result })

# ---------------------------------------------------------------------------
# Anomaly detection endpoints (Isolation Forest)
# Returns:
#   anomaly: true/false
#   score: float (lower = more anomalous, < -0.1 is flagged)
#   severity: "normal" | "unusual" | "anomalous"
# ---------------------------------------------------------------------------

def interpret_score(score):
    """Convert raw Isolation Forest score to a readable severity level."""
    if score < -0.2:
        return "anomalous"
    elif score < -0.1:
        return "unusual"
    else:
        return "normal"

@app.route('/anomaly/flood', methods=['POST'])
def anomaly_flood():
    data     = request.json
    water    = float(data.get('water', 0))
    distance = float(data.get('distance', 999))

    features = np.array([[water, distance]])
    score    = float(flood_anomaly.decision_function(features)[0])
    pred     = int(flood_anomaly.predict(features)[0])  # -1 = anomaly, 1 = normal
    is_anomaly = pred == -1

    return jsonify({
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score),
        'inputs':   { 'water': water, 'distance': distance }
    })

@app.route('/anomaly/fire', methods=['POST'])
def anomaly_fire():
    data        = request.json
    smoke       = float(data.get('smoke', 0))
    temperature = float(data.get('temperature', 0))

    features   = np.array([[smoke, temperature]])
    score      = float(fire_anomaly.decision_function(features)[0])
    pred       = int(fire_anomaly.predict(features)[0])
    is_anomaly = pred == -1

    return jsonify({
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score),
        'inputs':   { 'smoke': smoke, 'temperature': temperature }
    })

@app.route('/anomaly/earthquake', methods=['POST'])
def anomaly_earthquake():
    data      = request.json
    vibration = float(data.get('vibration', 0))

    features   = np.array([[vibration]])
    score      = float(earthquake_anomaly.decision_function(features)[0])
    pred       = int(earthquake_anomaly.predict(features)[0])
    is_anomaly = pred == -1

    return jsonify({
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score),
        'inputs':   { 'vibration': vibration }
    })

# ---------------------------------------------------------------------------
# Combined endpoint — classify + anomaly in one call
# Used by the backend after saving a reading
# ---------------------------------------------------------------------------
@app.route('/analyze/flood', methods=['POST'])
def analyze_flood():
    data     = request.json
    water    = float(data.get('water', 0))
    distance = float(data.get('distance', 999))
    features = np.array([[water, distance]])

    hazard    = flood_model.predict(features)[0]
    score     = float(flood_anomaly.decision_function(features)[0])
    is_anomaly = flood_anomaly.predict(features)[0] == -1

    return jsonify({
        'hazard':   hazard,
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score)
    })

@app.route('/analyze/fire', methods=['POST'])
def analyze_fire():
    data        = request.json
    smoke       = float(data.get('smoke', 0))
    temperature = float(data.get('temperature', 0))
    features    = np.array([[smoke, temperature]])

    hazard     = fire_model.predict(features)[0]
    score      = float(fire_anomaly.decision_function(features)[0])
    is_anomaly = fire_anomaly.predict(features)[0] == -1

    return jsonify({
        'hazard':   hazard,
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score)
    })

@app.route('/analyze/earthquake', methods=['POST'])
def analyze_earthquake():
    data      = request.json
    vibration = float(data.get('vibration', 0))
    features  = np.array([[vibration]])

    hazard     = earthquake_model.predict(features)[0]
    score      = float(earthquake_anomaly.decision_function(features)[0])
    is_anomaly = earthquake_anomaly.predict(features)[0] == -1

    return jsonify({
        'hazard':   hazard,
        'anomaly':  is_anomaly,
        'score':    round(score, 4),
        'severity': interpret_score(score)
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)