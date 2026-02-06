import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';

const LocationPicker = ({ 
  initialLatitude = 36.7525,  // Alger
  initialLongitude = 3.0420,  // Alger
  city = "Alger",
  onLocationSelected 
}) => {
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [searchQuery, setSearchQuery] = useState(city);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fonction de géocodage 
  const geocodeCity = async (cityName) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Recherche de la ville:', cityName);
      
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&addressdetails=1&limit=1&countrycodes=DZ`, // DZ = Algérie
        {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'ReservationSallesApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Résultat géocodage:', data);
      
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLon = parseFloat(data[0].lon);
        
        console.log('Ville trouvée:', data[0].display_name);
        console.log('Coordonnées:', newLat, newLon);
        
        setLatitude(newLat);
        setLongitude(newLon);
        setSearchQuery(data[0].display_name.split(',')[0]); 
        
        if (onLocationSelected) {
          onLocationSelected(newLat, newLon);
        }
        
        return { lat: newLat, lon: newLon };
      } else {
        setError(`Ville "${cityName}" non trouvée. Essayez un nom plus précis.`);
        return null;
      }
    } catch (error) {
      console.error('Erreur géocodage:', error);
      setError(`Erreur de recherche: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // chargement de la ville initiale
  useEffect(() => {
    if (city && city !== 'Alger') {
      geocodeCity(city);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await geocodeCity(searchQuery);
    }
  };

  const handleMapPositionChange = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    if (onLocationSelected) {
      onLocationSelected(lat, lng);
    }
  };

  // Suggestions des villes 
  const algerianCities = [
    "Tizi-ouzou","Alger", "Oran", "Constantine", "Annaba", "Blida", 
    "Batna", "Sétif", "Tlemcen", "Béjaïa", "Biskra"
  ];

  return (
    <div className="location-picker">
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>📍 Localisation de la salle</h3>
        
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">
            Rechercher une ville en Algérie
          </label>
          
          <div className="search-bar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex: Alger, Oran, Constantine..."
              list="algerian-cities"
              style={{ flex: 1 }}
            />
            <datalist id="algerian-cities">
              {algerianCities.map(city => (
                <option key={city} value={city} />
              ))}
            </datalist>
            <button 
              onClick={handleSearch}
              className="btn btn-primary"
              disabled={loading}
               style={{
              background: 'linear-gradient(135deg, #2c826ca8 )',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}
           
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
          
          <div className="quick-cities" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {algerianCities.map(city => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setSearchQuery(city);
                  geocodeCity(city);
                }}
                className="btn btn-secondary btn-sm"
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        
      </div>

      <div className="card">
        {loading ? (
          <div style={{ 
            height: '400px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <p>Chargement de la carte...</p>
          </div>
        ) : (
          <MapComponent
            latitude={latitude}
            longitude={longitude}
            zoom={15}
            markerText="Emplacement de la salle"
            draggable={true}
            onPositionChange={handleMapPositionChange}
            height="400px"
          />
        )}
        
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem', 
          backgroundColor: '#e9f7fe', 
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          <p style={{ margin: '0', color: '#31708f' }}>
            <strong>💡 Comment faire :</strong>
          </p>
          <ol style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '1rem' }}>
            <li>Recherchez votre ville (Alger, Oran, etc.)</li>
            <li>Déplacez le marqueur à l'emplacement exact</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;