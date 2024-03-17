from flask import Flask, request, jsonify
from flask_cors import CORS
from chargerLocations import get_closest_charging_station

app = Flask(__name__)
CORS(app)  # Activez CORS pour l'application Flask

# Route pour récupérer la borne de recharge la plus proche
@app.route('/get_closest_charging_station', methods=['POST'])
def get_closest_charging_station_route():
    data = request.json
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    
    closest_station = get_closest_charging_station(latitude, longitude)
    
    return jsonify(closest_station)

if __name__ == '__main__':
    app.run(debug=True)
