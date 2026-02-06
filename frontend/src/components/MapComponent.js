import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

//  pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ 
//  par défaut (latitude,longitude) de la ville d'alger
  latitude = 36.7525,  
  longitude = 3.0420,  
  zoom = 13,
  markerText = "Salle",
  draggable = false,
  onPositionChange = null,
  height = "400px"
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const initialized = useRef(false);

  
  useEffect(() => {
    if (!mapContainer.current || initialized.current) return;

    console.log('Initialisation carte avec:', latitude, longitude);

    
    map.current = L.map(mapContainer.current).setView([latitude, longitude], zoom);

    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map.current);

    
    marker.current = L.marker([latitude, longitude], {
      draggable: draggable,
      title: markerText
    }).addTo(map.current)
      .bindPopup(markerText)
      .openPopup();

    
    if (draggable && onPositionChange) {
      marker.current.on('dragend', (e) => {
        const position = e.target.getLatLng();
        console.log('Nouvelle position:', position.lat, position.lng);
        onPositionChange(position.lat, position.lng);
      });
    }

    initialized.current = true;

    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        initialized.current = false;
      }
    };
  }, []); 

  
  useEffect(() => {
    if (map.current && marker.current) {
      const newLatLng = L.latLng(latitude, longitude);
      map.current.setView(newLatLng, zoom);
      marker.current.setLatLng(newLatLng);
    }
  }, [latitude, longitude, zoom]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        height: height, 
        width: '100%', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}
    />
  );
};

export default MapComponent;