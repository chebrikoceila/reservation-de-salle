import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roomAPI, bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LocationPicker from '../components/LocationPicker';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [roomBookings, setRoomBookings] = useState({}); 
  const [expandedRooms, setExpandedRooms] = useState([]); 
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState({
    rooms: true,
    bookings: true,
    stats: true
  });
  
  const [newRoom, setNewRoom] = useState({
    title: '',
    description: '',
    capacity: '',
    price_per_hour: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France'
  });
  const [imageFile, setImageFile] = useState(null);
  const [showRoomForm, setShowRoomForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOwnerData();
    }
  }, [user]);

  const fetchOwnerData = async () => {
    await Promise.all([
      fetchOwnerRooms(),
      fetchOwnerBookings(),
      fetchOwnerStats()
    ]);
  };

  const fetchOwnerRooms = async () => {
    try {
      const response = await roomAPI.getOwnerRooms();
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Erreur chargement salles:', error);
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  };

  const fetchOwnerBookings = async () => {
    try {
      const response = await bookingAPI.getOwnerBookings();
      const bookingsData = response.data.bookings || [];
      setBookings(bookingsData);
      
   
      const grouped = {};
      bookingsData.forEach(booking => {
        if (!grouped[booking.room_id]) {
          grouped[booking.room_id] = [];
        }
        grouped[booking.room_id].push(booking);
      });
      setRoomBookings(grouped);
      
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  };

  const fetchOwnerStats = async () => {
    try {
      const response = await roomAPI.getOwnerStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  
  const toggleRoomBookings = (roomId) => {
    if (expandedRooms.includes(roomId)) {
      setExpandedRooms(expandedRooms.filter(id => id !== roomId));
    } else {
      setExpandedRooms([...expandedRooms, roomId]);
    }
  };

  //obtenir les réservations d'une salle spécifique
  const getRoomBookings = (roomId) => {
    return roomBookings[roomId] || [];
  };

  
  const getBookingStats = (roomId) => {
    const roomBookingsList = getRoomBookings(roomId);
    return {
      total: roomBookingsList.length,
      pending: roomBookingsList.filter(b => b.status === 'pending').length,
      confirmed: roomBookingsList.filter(b => b.status === 'confirmed').length,
      completed: roomBookingsList.filter(b => b.status === 'completed').length,
      cancelled: roomBookingsList.filter(b => b.status === 'cancelled').length
    };
  };

  const handleNewRoomChange = (e) => {
    setNewRoom({
      ...newRoom,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    
    Object.keys(newRoom).forEach(key => {
      formData.append(key, newRoom[key]);
    });
    
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRooms([...rooms, data.data.room]);
        setNewRoom({
          title: '',
          description: '',
          capacity: '',
          price_per_hour: '',
          address: '',
          city: '',
          postal_code: '',
          country: 'France'
        });
        setImageFile(null);
        setShowRoomForm(false);
        fetchOwnerStats();
      } else {
        console.error('Erreur création salle:', data.message);
        alert(data.message || 'Erreur lors de la création de la salle');
      }
    } catch (error) {
      console.error('Erreur création salle:', error);
      alert('Erreur lors de la création de la salle');
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      const response = await bookingAPI.confirm(bookingId);
      if (response.success) {
        fetchOwnerBookings(); 
      }
    } catch (error) {
      console.error('Erreur confirmation:', error);
    }
  };

 const handleRejectBooking = async (bookingId) => {
  if (!window.confirm('Voulez-vous vraiment refuser cette réservation ? Cette action est irréversible.')) {
    return;
  }
  
  try {
    console.log('Tentative de refus de la réservation:', bookingId);
    
    
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Réservation refusée avec succès');
      // Rafraîchir la liste
      fetchOwnerBookings();
    } else {
      alert (data.message || 'Échec du refus');
    }
    
  } catch (error) {
    console.error('Erreur complète:', error);
    alert(' Erreur de connexion au serveur');
  }
}; 


  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Annuler cette réservation ?')) return;
    
    try {
      
      const response = await bookingAPI.cancel(bookingId);
      if (response.success) {
        fetchOwnerBookings(); 
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Supprimer cette salle ?')) return;
    
    try {
      const response = await roomAPI.delete(roomId);
      if (response.success) {
        setRooms(rooms.filter(r => r.id !== roomId));
        fetchOwnerStats();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

 return (
    <div className="main-content">
      {/* En-tête */}
      <div className="card">
        <h1>Espace Propriétaire</h1>
        <p>Bienvenue dans votre espace de gestion, <strong>{user?.first_name}</strong></p>
      </div>

      
      <div className="card">
        <h2>Statistiques</h2>
        {loading.stats ? (
          <div className="empty-state">
            <div className="loading-spinner"></div>
            <p>Chargement des statistiques...</p>
          </div>
        ) : stats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{stats.total_rooms || 0}</h3>
              <p>Salles totales</p>
            </div>
            <div className="stat-card">
              <h3>{stats.available_rooms || 0}</h3>
              <p>Salles disponibles</p>
            </div>
            <div className="stat-card">
              <h3>{bookings.length}</h3>
              <p>Réservations</p>
            </div>
          </div>
        ) : (
          <p>Aucune statistique disponible</p>
        )}
      </div>

      
      <div className="card">
        <div className="section-header">
          <div>
            <h2>
              <span className="room-avatar">🏢</span>
              Mes salles ({rooms.length})
            </h2>
            <p>Gérez vos salles et leurs réservations</p>
          </div>
          <button 
            onClick={() => setShowRoomForm(!showRoomForm)}
            className="btn-primary-enhanced"
          >
            <span>{showRoomForm ? '×' : '+'}</span>
            {showRoomForm ? 'Annuler' : 'Ajouter une salle'}
          </button>
        </div>

        {showRoomForm && (
          <form onSubmit={handleAddRoom} className="room-form" encType="multipart/form-data">
            <h3>Nouvelle salle</h3>
            
            <div className="form-group">
              <label>Image de la salle (optionnel)</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="form-input"
              />
              {imageFile && (
                <p style={{ marginTop: '5px', color: 'green' }}>
                   Image sélectionnée: {imageFile.name}
                </p>
              )}
              <small>Formats acceptés: JPG, PNG, GIF, WebP</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Titre *</label>
                <input
                  type="text"
                  name="title"
                  value={newRoom.title}
                  onChange={handleNewRoomChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Ville *</label>
                <input
                  type="text"
                  name="city"
                  value={newRoom.city}
                  onChange={handleNewRoomChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            {newRoom.city && (
              <div className="form-group">
                <LocationPicker
                  city={newRoom.city}
                  onLocationSelected={(lat, lng) => {
                    setNewRoom({
                      ...newRoom,
                      latitude: lat,
                      longitude: lng
                    });
                  }}
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Capacité *</label>
                <input
                  type="number"
                  name="capacity"
                  value={newRoom.capacity}
                  onChange={handleNewRoomChange}
                  required
                  className="form-input"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Prix/heure (DA) *</label>
                <input
                  type="number"
                  name="price_per_hour"
                  value={newRoom.price_per_hour}
                  onChange={handleNewRoomChange}
                  required
                  className="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Adresse *</label>
              <input
                type="text"
                name="address"
                value={newRoom.address}
                onChange={handleNewRoomChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={newRoom.description}
                onChange={handleNewRoomChange}
                className="form-input"
                rows="3"
              />
            </div>
            
            <input type="hidden" name="latitude" value={newRoom.latitude || ''} />
            <input type="hidden" name="longitude" value={newRoom.longitude || ''} />

            <button type="submit" className="btn-primary-enhanced">
              Créer la salle
            </button>
          </form>
        )}

        {loading.rooms ? (
          <div className="empty-state">
            <div className="loading-spinner"></div>
            <p>Chargement de vos salles...</p>
          </div>
        ) : rooms.length > 0 ? (
          <div className="rooms-list">
            {rooms.map(room => {
              const roomBookingStats = getBookingStats(room.id);
              const isExpanded = expandedRooms.includes(room.id);
              const roomBookings = getRoomBookings(room.id);
              
              return (
                <div key={room.id} className="room-item">
                  <div className="room-header">
                    <div className="room-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                        <div className="room-avatar">
                          {room.title.charAt(0)}
                        </div>
                        <div>
                          <h4 className="room-title">{room.title}</h4>
                          <div className="room-meta">
                            <span>Lieu: {room.city}</span>
                            <span>Capacité: {room.capacity} pers.</span>
                            <span>Prix: {room.price_per_hour}DA/h</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="booking-stats">
                        <span className={`room-status ${room.is_available ? 'available' : 'unavailable'}`}>
                          {room.is_available ? ' Disponible' : 'Indisponible'}
                        </span>
                        
                        {roomBookingStats.total > 0 && (
                          <>
                            <span className="stat-badge total">
                               {roomBookingStats.total} réservation(s)
                            </span>
                            
                            {roomBookingStats.pending > 0 && (
                              <span className="stat-badge pending">
                                 {roomBookingStats.pending} en attente
                              </span>
                            )}
                            
                            {roomBookingStats.confirmed > 0 && (
                              <span className="stat-badge confirmed">
                                 {roomBookingStats.confirmed} confirmée(s)
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="room-actions">
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to={`/rooms/${room.id}`} className="btn-secondary-enhanced">
                          Voir
                        </Link>
                        
                        <button 
                          onClick={() => handleDeleteRoom(room.id)}
                          className="btn-danger-enhanced"
                        >
                          Supprimer
                        </button>
                      </div>
                      
                      {roomBookingStats.total > 0 && (
                        <button 
                          onClick={() => toggleRoomBookings(room.id)}
                          className="toggle-btn"
                        >
                          <span>{isExpanded ? '▲' : '▼'}</span>
                          {isExpanded ? 'Masquer les réservations' : 'Voir les réservations'}
                          <span className="toggle-count">{roomBookingStats.total}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && roomBookingStats.total > 0 && (
                    <div className="room-bookings">
                      <h5>
                        
                        Réservations pour cette salle
                      </h5>
                      
                      <div>
                        {roomBookings.map(booking => (
                          <div key={booking.id} className={`booking-item ${booking.status}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                  <strong>Réservation #{booking.id}</strong>
                                  <span className={`status-badge ${booking.status}`}>
                                    {booking.status === 'confirmed' ? ' Confirmée' :
                                     booking.status === 'pending' ? ' En attente' :
                                     booking.status === 'cancelled' ? ' Annulée' : booking.status}
                                  </span>
                                </div>
                                
                                <div style={{ 
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                  gap: '15px',
                                  marginTop: '10px'
                                }}>
                                  <div>
                                    <p><strong> Client:</strong> {booking.client_first_name} {booking.client_last_name}</p>
                                    <p><strong> Prix:</strong> {booking.total_price}DA</p>
                                  </div>
                                  <div>
                                    <p><strong> Début:</strong> {new Date(booking.start_datetime).toLocaleString('fr-FR')}</p>
                                    <p><strong> Fin:</strong> {new Date(booking.end_datetime).toLocaleString('fr-FR')}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {booking.status === 'pending' && (
                                <div className="booking-actions">
                                  <button 
                                    onClick={() => handleConfirmBooking(booking.id)}
                                    className="btn-success-enhanced"
                                  >
                                    Confirmer
                                  </button>
                                    <button 
                                     onClick={() => handleRejectBooking(booking.id)}
                                     className="btn btn-danger btn-sm"
                                     >
                                    Refuser
                                     </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h3>Aucune salle créée</h3>
            <p>Commencez par ajouter votre première salle pour la proposer à la location.</p>
            <button 
              onClick={() => setShowRoomForm(true)}
              className="btn-primary-enhanced"
            >
              + Ajouter ma première salle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;