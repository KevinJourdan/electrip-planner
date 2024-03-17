function initMap() {
    var mapOptions = {
        zoom: 7,
        center: { lat: 46.2276, lng: 2.2137 } // Centre de la France
    };

    var map = new google.maps.Map(document.getElementById('map'), mapOptions);

    var directionsService = new google.maps.DirectionsService();
    var directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    var startInput = document.getElementById('start');
    var endInput = document.getElementById('end');

    var autocompleteStart = new google.maps.places.Autocomplete(startInput);
    var autocompleteEnd = new google.maps.places.Autocomplete(endInput);

    document.getElementById('calculateRoute').addEventListener('click', function () {
        const startLocation = autocompleteStart.getPlace();
        const endLocation = autocompleteEnd.getPlace();

        if (startLocation && endLocation) {
            // calculer l'itinéraire
            calculateRoute(startLocation, endLocation);
        } else {
            alert('Veuillez entrer à la fois un point de départ et un point d’arrivée.');
        }
    });

    function calculateRoute(startLocation, endLocation) {
        const selectedVehicle = window.selectedVehicle;
        const origin = startLocation.formatted_address;
        const destination = endLocation.formatted_address;

        // Vérifie si un véhicule est sélectionné
        if (!selectedVehicle) {
            alert("Veuillez sélectionner un véhicule.");
            return; // Arrête l'exécution de la fonction si aucun véhicule n'est sélectionné
        }

        const request = {
            origin: origin,
            destination: destination,
            travelMode: 'DRIVING',
        };

        // Utiliser l'API Google Maps pour calculer l'itinéraire initial
        directionsService.route(request, function (response, status) {
            if (status === 'OK') {
                const totalDistance = calculateTotalDistance(response); // Calculer la distance totale du trajet
                if (totalDistance <= selectedVehicle.bestRange) {
                    // Si la distance est inférieure ou égale à la meilleure autonomie du véhicule, afficher le trajet sans aucune modification
                    directionsRenderer.setDirections(response);
                } else {
                    // Sinon, calculer les arrêts de recharge nécessaires
                    const numStops = Math.floor(totalDistance / selectedVehicle.bestRange);
                    const waypoints = []; // Tableau pour stocker les waypoints

                    // Appeler la fonction getClosestChargingStation de manière asynchrone pour chaque waypoint
                    let promises = [];
                    for (let i = 1; i <= numStops; i++) {
                        const distanceKm = i * selectedVehicle.bestRange;
                        const coordinates = getCoordinatesBeforeDistance(response, distanceKm);

                        // Ajouter la promesse à la liste des promesses
                        promises.push(getClosestChargingStation(coordinates));
                    }

                    // Attendre que toutes les promesses soient résolues
                    Promise.all(promises).then((chargingStations) => {
                        // Une fois que toutes les stations de recharge sont obtenues, les ajouter en tant que waypoints
                        chargingStations.forEach(station => {
                            waypoints.push({
                                location: station,
                                stopover: true
                            });
                        });

                        // Mettre à jour la demande d'itinéraire avec les waypoints
                        request.waypoints = waypoints;

                        // Calculer l'itinéraire final avec les waypoints
                        directionsService.route(request, function (updatedResponse, updatedStatus) {
                            if (updatedStatus === 'OK') {
                                directionsRenderer.setDirections(updatedResponse);
                            } else {
                                window.alert('La demande d\'itinéraire avec les arrêts de recharge a échoué en raison de ' + updatedStatus);
                            }
                        });
                    }).catch(error => {
                        console.error('Erreur lors de la récupération des stations de recharge:', error);
                    });
                }
            } else {
                window.alert('La demande d\'itinéraire a échoué en raison de ' + status);
            }
        });
    }

    // Fonction pour calculer la distance totale du trajet en kilomètres
    function calculateTotalDistance(response) {
        let totalDistance = 0;
        response.routes[0].legs.forEach(leg => {
            totalDistance += leg.distance.value / 1000; // Convertir en kilomètres
        });
        return totalDistance;
    }

    // Fonction pour calculer les coordonnées d'un point avant une certaine distance le long du trajet
    function getCoordinatesBeforeDistance(response, distanceKm) {
        let totalDistance = 0;
        let coordinates = null;

        for (let i = 0; i < response.routes[0].legs.length; i++) {
            const leg = response.routes[0].legs[i];

            for (let j = 0; j < leg.steps.length; j++) {
                const step = leg.steps[j];
                const stepDistance = step.distance.value / 1000; // Convertir la distance en kilomètres

                // Vérifier si la distance accumulée dépasse la distance souhaitée
                if (totalDistance + stepDistance > distanceKm) {
                    // Interpoler les coordonnées du point juste avant de dépasser la distance souhaitée
                    const ratio = (distanceKm - totalDistance) / stepDistance;
                    const lat = step.start_location.lat() + (step.end_location.lat() - step.start_location.lat()) * ratio;
                    const lng = step.start_location.lng() + (step.end_location.lng() - step.start_location.lng()) * ratio;
                    coordinates = { lat: lat, lng: lng };
                    break;
                }

                totalDistance += stepDistance;
            }

            if (coordinates) {
                break;
            }
        }

        return coordinates;
    }

    // Fonction pour obtenir la station de recharge la plus proche des coordonnées fournies
    function getClosestChargingStation(coordinates) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: 'http://localhost:5000/get_closest_charging_station',
                data: JSON.stringify({ latitude: coordinates.lat, longitude: coordinates.lng }),
                contentType: 'application/json',
                success: function (response) {
                    // Vérifier si la réponse contient les données de latitude et de longitude
                    if (response.latitude && response.longitude) {
                        resolve({ lat: response.latitude, lng: response.longitude });
                    } else {
                        reject(new Error('La réponse de la requête AJAX est nulle ou ne contient pas de données de latitude.'));
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Erreur lors de la récupération des stations de recharge:', error);
                    reject(error);
                }
            });
        });
    }
}
