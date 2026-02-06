import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { roomAPI, bookingAPI, reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MapComponent from '../components/MapComponent';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [bookingData, setBookingData] = useState({
    start_datetime: '',
    end_datetime: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [amenities, setAmenities] = useState([]);
  const [roomImages, setRoomImages] = useState([]); 

  useEffect(() => {
    fetchRoomDetails();
    fetchReviews();
  }, [id]);

  const fetchRoomDetails = async () => {
    setLoading(true);
    try {
      const response = await roomAPI.getById(id);
      const roomData = response.data.room;
      setRoom(roomData);
      
      // récupérer les images
      if (roomData.images && Array.isArray(roomData.images)) {
        setRoomImages(roomData.images);
      } else if (roomData.image) {
        
        setRoomImages([roomData.image]);
      }
      
      
      try {
        if (roomData.amenities && roomData.amenities.trim() !== '') {
          const parsedAmenities = JSON.parse(roomData.amenities);
          setAmenities(Array.isArray(parsedAmenities) ? parsedAmenities : []);
        } else {
          setAmenities([]);
        }
      } catch (error) {
        console.error('Erreur parsing amenities:', error);
        setAmenities([]);
      }
    } catch (error) {
      console.error('Erreur chargement salle:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getRoomReviews(id);
      setReviews(response.data?.reviews || []);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
      setReviews([]);
    }
  };

  const handleBookingChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  const calculateTotalPrice = () => {
    if (!room || !bookingData.start_datetime || !bookingData.end_datetime) {
      return 0;
    }
    
    const start = new Date(bookingData.start_datetime);
    const end = new Date(bookingData.end_datetime);
    const hours = (end - start) / (1000 * 60 * 60);
    
    return hours * room.price_per_hour;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');
    
    if (!user) {
      setBookingError('Vous devez être connecté pour réserver');
      navigate('/login');
      return;
    }

    if (!bookingData.start_datetime || !bookingData.end_datetime) {
      setBookingError('Veuillez sélectionner les dates');
      return;
    }

    setIsBooking(true);
    try {
      const bookingPayload = {
        room_id: parseInt(id),
        ...bookingData
      };
      
      const response = await bookingAPI.create(bookingPayload);
      
      if (response.success) {
        setBookingSuccess('Réservation créée avec succès !');
        setBookingData({
          start_datetime: '',
          end_datetime: ''
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      setBookingError(error.message || 'Erreur lors de la réservation');
    } finally {
      setIsBooking(false);
    }
  };

  // fonction pour obtenir l'URL d'une image
  const getImageUrl = (image) => {
    if (image && image.image_url) {
      return `http://localhost:5000/uploads/rooms/${image.image_url}`;
    }
    return '/default-room.jpg';
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="card">
          <p>Chargement de la salle...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="main-content">
        <div className="card">
          <h2>Salle non trouvée</h2>
          <p>La salle que vous recherchez n'existe pas ou a été supprimée.</p>
          <Link to="/rooms" className="btn btn-primary">
            Retour aux salles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <div className="room-header">
          <h1>{room.title}</h1>
          <div className="room-meta">
            <span className="location">Lieu: {room.city}, Algerie</span>
            <span className="capacity">Capacité:  {room.capacity} personnes</span>
            <span className="price">Prix: {room.price_per_hour}DA/heure</span>
          </div>
        </div>

        
        {roomImages.length > 0 && (
          <div className="room-images-section">
            <h3>Photos de la salle</h3>
            <div className="room-images-grid">
              {roomImages.map((image, index) => (
                <div key={index} className="room-image-item">
                  <img 
                    src={getImageUrl(image)} 
                    alt={`${room.title} - Image ${index + 1}`}
                    className="room-detail-image"
                    onError={(e) => {
                      e.target.src = '/default-room.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="room-content">
          <div className="room-description">
            <h3>Description</h3>
            <p>{room.description || 'Aucune description disponible.'}</p>
            
            <h3>Adresse</h3>
            <p>{room.address}<br />
            {room.postal_code} {room.city}<br />
            , Algerie</p>
            
            {room.latitude && room.longitude && (
              <div className="card" style={{ marginTop: '1rem' }}>
                 <h3>📍 Localisation</h3>
                 <MapComponent
                 latitude={parseFloat(room.latitude)}
                 longitude={parseFloat(room.longitude)}
                 zoom={15}
                 markerText={room.title}
                 height="300px"
               />
               <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                 <small>Utilisez la carte pour voir l'emplacement exact de la salle</small>
               </p>
              </div>
            )}


            {amenities.length > 0 && (
              <>
                <h3>Équipements</h3>
                <div className="amenities">
                  {amenities.map((amenity, index) => (
                    <span key={index} className="amenity-tag">
                      {amenity}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="booking-section">
            <h3>Réserver cette salle</h3>
            
            {bookingError && (
              <div className="alert alert-error">
                {bookingError}
              </div>
            )}
            
            {bookingSuccess && (
              <div className="alert alert-success">
                {bookingSuccess}
              </div>
            )}

            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label className="form-label">Date et heure de début</label>
                <input
                  type="datetime-local"
                  name="start_datetime"
                  className="form-input"
                  value={bookingData.start_datetime}
                  onChange={handleBookingChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date et heure de fin</label>
                <input
                  type="datetime-local"
                  name="end_datetime"
                  className="form-input"
                  value={bookingData.end_datetime}
                  onChange={handleBookingChange}
                  required
                />
              </div>

              <div className="price-calculation">
                <p>Total estimé: <strong>{calculateTotalPrice().toFixed(2)}DA</strong></p>
                <small>Basé sur {room.price_per_hour}DA/heure</small>
              </div>

              {user ? (
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isBooking}
                  style={{ width: '100%' }}
                >
                  {isBooking ? 'Réservation en cours...' : 'Réserver maintenant'}
                </button>
              ) : (
                <Link to="/login" className="btn btn-primary" style={{ width: '100%', display: 'block' }}>
                  Connectez-vous pour réserver
                </Link>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Avis des clients ({reviews.length})</h3>
        
        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review.id} className="review">
                <div className="review-header">
                  <strong>{review.first_name} {review.last_name}</strong>
                  <span className="rating">{"⭐".repeat(review.rating)}</span>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucun avis pour le moment.</p>
        )}
        
        {user && (
  <Link to={`/reviews/create/${id}`} className="btn btn-secondary">
    Laisser un avis
  </Link>
)}
      </div>

      <div className="card">
        <Link to="/rooms" className="btn btn-secondary">
          Retour à la liste des salles
        </Link>
      </div>

    </div>
  );
};

export default RoomDetail;