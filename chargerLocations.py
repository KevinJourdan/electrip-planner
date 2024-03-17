import requests

def get_closest_charging_station(latitude, longitude):
    """
    Renvoie les coordonnées de la borne de recharge la plus proche à partir d'une latitude et longitude données.
    
    Paramètres :
    latitude (str): La latitude du point de départ.
    longitude (str): La longitude du point de départ.
    
    Retourne :
    dict: Un dictionnaire contenant les coordonnées de la borne la plus proche et des informations supplémentaires,
          ou None si aucune borne n'a été trouvée.
    """
    # URL de l'API avec filtrage par distance et limitation à un seul résultat
    api_url = "https://odre.opendatasoft.com/api/records/1.0/search/"
    api_url += "?dataset=bornes-irve"
    api_url += "&rows=1"  # Limite les résultats à la borne la plus proche
    api_url += "&geofilter.distance=" + str(latitude) + "," + str(longitude) + ",50000"  # Rayon de 15000 mètres pour s'assurer de trouver une borne

    try:
        response = requests.get(api_url)
        response.raise_for_status()  # Cela va lever une exception pour les codes d'erreur HTTP

        data = response.json()
        if data['records']:  # Vérifie si la liste des enregistrements n'est pas vide
            closest_station = data['records'][0]  # Prend la première borne, la plus proche
            return {
                "adresse": closest_station['fields'].get('ad_station', 'Non spécifiée'),
                "latitude": closest_station['fields'].get('ylatitude'),
                "longitude": closest_station['fields'].get('xlongitude'),
                "type_prise": closest_station['fields'].get('type_prise', 'Non spécifié'),
                "puissance_max": closest_station['fields'].get('puiss_max', 'Non spécifiée')
            }
        else:
            print("Aucune borne de recharge trouvée.")
            return None
    except requests.RequestException as e:
        print(f"Erreur lors de la requête à l'API : {e}")
        return None

# Exemple d'utilisation de la fonction
#latitude = "48.85"
#longitude = "2.3"
#closest_station = get_closest_charging_station(latitude, longitude)
#if closest_station:
#    print("Coordonnées de la borne de recharge la plus proche :")
#    print(closest_station)
#else:
#    print("Impossible de récupérer les informations de la borne la plus proche.")
