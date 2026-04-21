from flask import Flask, request, jsonify
import joblib
import os

app = Flask(__name__)

# Load all three models with absolute paths
base_dir = os.path.dirname(os.path.abspath(__file__))
flood_model = joblib.load(os.path.join(base_dir, 'flood/flood_model.pkl'))
fire_model = joblib.load(os.path.join(base_dir, 'fire/fire_model.pkl'))
earthquake_model = joblib.load(os.path.join(base_dir, 'earthquake/earthquake_model.pkl'))

@app.route('/classify/flood', methods=['POST'])
def classify_flood():
    data = request.json
    water = data.get('water', 0)
    distance = data.get('distance', 999)
    result = flood_model.predict([[water, distance]])[0]
    return jsonify({ 'hazard': result })

@app.route('/classify/fire', methods=['POST'])
def classify_fire():
    data = request.json
    smoke = data.get('smoke', 0)
    temperature = data.get('temperature', 0)
    result = fire_model.predict([[smoke, temperature]])[0]
    return jsonify({ 'hazard': result })

@app.route('/classify/earthquake', methods=['POST'])
def classify_earthquake():
    data = request.json
    vibration = data.get('vibration', 0)
    result = earthquake_model.predict([[vibration]])[0]
    return jsonify({ 'hazard': result })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)