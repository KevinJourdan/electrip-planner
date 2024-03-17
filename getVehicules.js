let vehicles; // Définir vehicles comme une variable globale

document.getElementById('loadVehicles').addEventListener('click', function loadVehicles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase(); // Récupérer le terme de recherche actuel
    fetch('https://api.chargetrip.io/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-client-id': '65df318bcd8cc4878330bc6c',
            'x-app-id': '65df318ccd8cc4878330bc6e',
        },
        body: JSON.stringify({
            query: `
            query VehicleList($size: Int, $search: String) {
                vehicleList(size: $size, search: $search) {
                    id
                    naming {
                        make
                        model
                    }
                    battery {
                        usable_kwh
                    }
                    range {
                        chargetrip_range {
                            best
                        }
                    }
                    connectors {
                        standard
                        power
                        max_electric_power
                        time
                    }
                    media {
                        image {
                            url
                        }
                    }
                    drivetrain {
                        type
                    }
                }
            }                         
            `,
            variables: {
                size: 100,
                search: searchTerm, // Utiliser le terme de recherche actuel dans la requête
            }
        }),
    })
    .then(response => response.json())
    .then(data => {
        if(data.errors) {
            console.error('GraphQL Errors:', data.errors);
            return;
        }
        // Filtrer les véhicules pour ne prendre que les BEV (Battery Electric Vehicle)
        vehicles = data.data.vehicleList.filter(isElectricVehicle);
        displayVehicles(vehicles);
    })    
    .catch(error => {
        console.error('Network error:', error);
    });
});

function displayVehicles(vehicles) {
    const list = document.getElementById('vehicleList');
    list.innerHTML = ''; // Efface la liste existante

    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase();

    const processedModels = [];
    filterAndDisplayVehicles(vehicles, list, processedModels, searchTerm);
}

function isElectricVehicle(vehicle) {
    // Vérifie si le type de drivetrain est BEV (Battery Electric Vehicle)
    return vehicle.drivetrain && vehicle.drivetrain.type === 'BEV';
}

function filterAndDisplayVehicles(vehicles, list, processedModels, searchTerm) {
    if (vehicles && Array.isArray(vehicles)) {
        vehicles.forEach(vehicle => {
            const modelKey = `${vehicle.naming.make} ${vehicle.naming.model}`;

            // Vérifie si le modèle de voiture a déjà été traité et s'il correspond à la recherche
            if (!processedModels.includes(modelKey) && modelKey.toLowerCase().includes(searchTerm)) {
                processedModels.push(modelKey);

                const item = document.createElement('div');
                item.classList.add('vehicle-item');

                const imageUrl = vehicle.media && vehicle.media.image && vehicle.media.image.url ? vehicle.media.image.url : 'placeholder-image-url.jpg';
                const chargeTime = parseFloat(vehicle.connectors[0].time); // Convertir en float
                const bestRange = parseFloat(vehicle.range.chargetrip_range.best); // Convertir en float

                item.innerHTML = `
                    <div class="vehicle-image">
                        <img src="${imageUrl}" alt="${vehicle.naming.make} ${vehicle.naming.model}" style="width: 100px; height: auto;">
                    </div>
                    <div class="vehicle-info">
                        <h4>${vehicle.naming.make} ${vehicle.naming.model}</h4>
                        <p>Usable Battery: ${vehicle.battery.usable_kwh} kWh</p>
                        <p>Best Range: ${bestRange} km</p>
                        <p>Charge Time (10% to 80%): ${chargeTime}</p>
                    </div>
                `;

                item.addEventListener('click', function () {
                    // Stocke les informations nécessaires du véhicule sélectionné dans une variable globale
                    window.selectedVehicle = {
                        make: vehicle.naming.make,
                        model: vehicle.naming.model,
                        usableBattery: vehicle.battery.usable_kwh,
                        bestRange: bestRange,
                        chargeTime: chargeTime
                    };
                    console.log(`Vehicle Selected: ${vehicle.naming.make} ${vehicle.naming.model}`);

                    // Fermer la liste des véhicules
                    list.innerHTML = '';
                });

                list.appendChild(item);
            }
        });
    } else {
        console.error('Expected vehicles data is not available or is not an array.');
    }
}

// Ajoutez un gestionnaire d'événements pour le clic sur le bouton "Rechercher"
document.getElementById('searchButton').addEventListener('click', function () {
    loadVehicles(); // Appeler la fonction loadVehicles pour effectuer la recherche
});

// Sélectionnez l'élément de recherche par son ID
const searchInput = document.getElementById('searchInput');

// Ajoutez un gestionnaire d'événements pour l'événement input
searchInput.addEventListener('input', function () {
    // Récupérez la valeur de la barre de recherche
    const searchTerm = searchInput.value.toLowerCase();

    // Filtrez et affichez les véhicules en fonction du terme de recherche
    displayVehicles(vehicles, searchTerm);
});
