import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI, reviewAPI, roomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CreateReview = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [booking, setBooking] = useState(null);
  const [reviewData, setReviewData] = useState({
    booking_id: '',
    rating: 5,
    comment: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchData();
  }, [roomId, user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      
      const roomResponse = await roomAPI.getById(roomId);
      setRoom(roomResponse.data.room);
      
      
      const bookingsResponse = await bookingAPI.getMyBookings();
      const bookings = bookingsResponse.data.bookings || [];
      
      console.log('Toutes mes réservations:', bookings);
      
      
      const completedBooking = bookings.find(
        b => parseInt(b.room_id) === parseInt(roomId) && b.status === 'completed'
      );
      
      console.log('Réservation terminée trouvée:', completedBooking);
      
      if (!completedBooking) {
        setError('Vous n\'avez pas de réservation terminée pour cette salle.');
        setBooking(null);
      } else {
        setBooking(completedBooking);
        setReviewData(prev => ({ 
          ...prev, 
          booking_id: completedBooking.id 
        }));
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setReviewData({
      ...reviewData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      console.log('Envoi de l\'avis:', reviewData);
      const response = await reviewAPI.create(reviewData);
      
      if (response.success) {
        alert(' Avis publié avec succès !');
        navigate(`/rooms/${roomId}`);
      }
    } catch (error) {
      console.error('Erreur création avis:', error);
      setError(error.message || 'Erreur lors de la publication de l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="card">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="main-content">
        <div className="card">
          <h2>Impossible de laisser un avis</h2>
          <p className="error-message" style={{ color: 'red', margin: '1rem 0' }}>
            {error}
          </p>
          
          <div style={{ marginTop: '1rem' }}>
            <p>Pour laisser un avis, vous devez :</p>
            <ol style={{ textAlign: 'left', marginLeft: '1.5rem' }}>
              <li>Avoir réservé cette salle</li>
              <li>Que la réservation soit terminée (statut "completed")</li>
              <li>Ne pas avoir déjà laissé un avis pour cette réservation</li>
            </ol>
          </div>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => navigate(`/rooms/${roomId}`)} 
              className="btn btn-primary"
            >
              Retour à la salle
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn btn-secondary"
            >
              Voir mes réservations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <h1> Laisser un avis</h1>
        <p>Pour la salle : <strong>{room?.title}</strong></p>
        {booking && (
          <p>
            Réservation #{booking.id} - 
            Terminée le {new Date(booking.end_datetime).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>

      <div className="card">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Note (1 à 5 étoiles)</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${reviewData.rating >= star ? 'active' : ''}`}
                  onClick={() => setReviewData({...reviewData, rating: star})}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '2rem',
                    cursor: 'pointer',
                    color: reviewData.rating >= star ? '#ffc107' : '#ddd',
                    transition: 'color 0.2s'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <input
              type="hidden"
              name="rating"
              value={reviewData.rating}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Commentaire</label>
            <textarea
              name="comment"
              className="form-input"
              value={reviewData.comment}
              onChange={handleChange}
              rows="5"
              placeholder="Partagez votre expérience (optionnel)..."
              maxLength="500"
              style={{ width: '100%', padding: '0.75rem' }}
            />
            <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
              {reviewData.comment.length}/500 caractères
            </small>
          </div>

          <div className="form-buttons" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? 'Publication...' : 'Publier l\'avis'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate(`/rooms/${roomId}`)}
              style={{ flex: 1 }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReview;