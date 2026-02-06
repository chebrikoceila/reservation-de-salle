import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roomAPI } from '../services/api';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    minCapacity: ''
  });
  const [totalRooms, setTotalRooms] = useState(0);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async (filtersToApply = filters) => {
    setLoading(true);
    try {
      
      const cleanFilters = Object.fromEntries(
        Object.entries(filtersToApply).filter(([_, v]) => v !== '')
      );
      
      const response = await roomAPI.getAll(cleanFilters);
      setRooms(response.data.rooms || []);
      setTotalRooms(response.data.total || (response.data.rooms ? response.data.rooms.length : 0));
    } catch (error) {
      console.error('Erreur chargement salles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  const handleResetFilters = () => {
    setFilters({
      city: '',
      minPrice: '',
      maxPrice: '',
      minCapacity: ''
    });
    fetchRooms({});
  };

  // fonction pour obtenir l'URL de l'image
  const getRoomImage = (room) => {

    // Si la salle a une image stockée dans room.image
    if (room.image && room.image.image_url) {
      return `http://localhost:5000/uploads/rooms/${room.image.image_url}`;
    }
    
    // Si la salle a des images dans room.images 
    if (room.images && room.images.length > 0) {
      return `http://localhost:5000/uploads/rooms/${room.images[0].image_url}`;
    }
    
    // image par défaut
    return '/default-room.jpg'; 
  };

  return (
    <div className="main-content">
      <div className="card">
        <h1>Trouver les salles disponibles</h1>
        <p className="subtitle">
          {totalRooms} {totalRooms > 1 ? 'salles trouvées' : 'salle trouvée'}
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleFilterSubmit} className="filter-form">
          <div className="filter-grid">
            <div className="form-group">
              <label className="form-label">Ville</label>
              <input
                type="text"
                name="city"
                className="form-input"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="Alger, Tizi..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Capacité minimum</label>
              <input
                type="number"
                name="minCapacity"
                className="form-input"
                value={filters.minCapacity}
                onChange={handleFilterChange}
                placeholder="5"
                min="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Prix minimum (DA/h)</label>
              <input
                type="number"
                name="minPrice"
                className="form-input"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="20"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Prix maximum (DA/h)</label>
              <input
                type="number"
                name="maxPrice"
                className="form-input"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="200"
                min="0"
              />
            </div>
          </div>

          <div className="filter-buttons">
            <button type="submit" className="btn btn-primary">
              Appliquer les filtres
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleResetFilters}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="card">
          <p>Chargement des salles...</p>
        </div>
      ) : rooms.length > 0 ? (
        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room.id} className="card room-card">

              {/* image de la salle */}

              <div className="room-image-container">
                <img 
                  src={getRoomImage(room)} 
                  alt={room.title}
                  className="room-image"
                  onError={(e) => {
                    // image par défaut si il ya une erreur de chargement
                    e.target.src = '/default-room.jpg'; 
                  }}
                />
              </div>
              
              <h3>{room.title}</h3>
              <p className="location">
                Lieu : {room.address}, {room.city} {room.postal_code}
              </p>
              <p className="capacity">  Capacité : {room.capacity} personnes</p>
              <p className="description">
                {room.description ? 
                  (room.description.length > 100 ? 
                    room.description.substring(0, 100) + '...' : 
                    room.description
                  ) : 
                  'Pas de description disponible'
                }
              </p>
              <div className="room-footer">
                <span className="price">{room.price_per_hour}DA/heure</span>
                <Link to={`/rooms/${room.id}`} className="btn btn-primary">
                  Voir détails
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <p>Aucune salle ne correspond à vos critères.</p>
          <button 
            onClick={handleResetFilters}
            className="btn btn-secondary"
          >
            Voir toutes les salles
          </button>
        </div>
      )}

      
    </div>
  );
};

export default RoomList;