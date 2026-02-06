import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roomAPI } from '../services/api';

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedRooms();
  }, []);

  const fetchFeaturedRooms = async () => {
    try {
      const response = await roomAPI.getAll({ limit: 3 });
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Erreur chargement salles:', error);
    } finally {
      setLoading(false);
    }
  };

  // fonction pour obtenir l'URL de l'image
  const getRoomImage = (room) => {
    
    if (room.image && room.image.image_url) {
      return `http://localhost:5000/uploads/rooms/${room.image.image_url}`;
    }
    
    
    if (room.images && room.images.length > 0) {
      return `http://localhost:5000/uploads/rooms/${room.images[0].image_url}`;
    }
    
    // image par defaut
    return '/default-room.jpg';
  };

  return (
    <div className="main-content">
      <div className="card">
        <h1>Bienvenue sur la plateforme de réservation de salles</h1>
        <p className="description">
          Réservez la salle parfaite pour vos réunions, conférences ou événements.
          Des espaces professionnels dans toute l'algerie.
        </p>
        
        <div className="cta-buttons">
          <Link to="/rooms" className="btn btn-primary">
            Chercher et réserver une salle
          </Link>
        </div>
      </div>

      <div className="card">
        <h2>Salles populaires</h2>
        {loading ? (
          <p>Chargement des salles...</p>
        ) : rooms.length > 0 ? (
          <div className="rooms-grid">
            {rooms.map(room => (
              <div key={room.id} className="room-card">
              
                <div className="room-image-container">
                  <img 
                    src={getRoomImage(room)} 
                    alt={room.title}
                    className="room-image"
                    onError={(e) => {
                      e.target.src = '/default-room.jpg';
                    }}
                  />
                </div>
                
                <h3>{room.title}</h3>
                <p>{room.city} • {room.capacity} personnes</p>
                <p className="price">{room.price_per_hour}DA/heure</p>
                <Link to={`/rooms/${room.id}`} className="btn btn-primary">
                  Voir détails
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucune salle disponible pour le moment.</p>
        )}
      </div>

     
    </div>
  );
};

export default Home;