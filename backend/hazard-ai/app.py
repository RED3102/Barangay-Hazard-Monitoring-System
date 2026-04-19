from flask import Flask, request, jsonify
import joblib
import os

app = Flask(__name__)

# Load all three models
flood_model     = joblib.load('flood/flood_model.pkl')
fire_model      = joblib.load('fire/fire_model.pkl')
earthquake_model = joblib.load('earthquake/earthquake_model.pkl')

@app.route('/classify/flood', methods=['POST'])
def classify_flood():
    data = request.json
    water    = data.get('water', 0)
    distance = data.get('distance', 999)
    result   = flood_model.predict([[water, distance]])[0]
    return jsonify({ 'hazard': result })

@app.route('/classify/fire', methods=['POST'])
def classify_fire():
    data = request.json
    smoke       = data.get('smoke', 0)
    temperature = data.get('temperature', 0)
    result      = fire_model.predict([[smoke, temperature]])[0]
    return jsonify({ 'hazard': result })

@app.route('/classify/earthquake', methods=['POST'])
def classify_earthquake():
    data = request.json
    vibration = data.get('vibration', 0)
    result    = earthquake_model.predict([[vibration]])[0]
    return jsonify({ 'hazard': result })

if __name__ == '__main__':
    app.run(port=5000, debug=True)