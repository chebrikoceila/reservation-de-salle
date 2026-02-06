import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomAPI, bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    start_datetime: '',
    end_datetime: '',
    notes: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchRoom();
  }, [id, user, navigate]);

  const fetchRoom = async () => {
    setLoading(true);
    try {
      const response = await roomAPI.getById(id);
      setRoom(response.data.room);
    } catch (error) {
      console.error('Erreur chargement salle:', error);
      setError('Impossible de charger la salle');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateDuration = () => {
    if (!formData.start_datetime || !formData.end_datetime) {
      return 0;
    }
    
    const start = new Date(formData.start_datetime);
    const end = new Date(formData.end_datetime);
    return (end - start) / (1000 * 60 * 60); 
  };

  const calculateTotal = () => {
    if (!room) return 0;
    const hours = calculateDuration();
    return hours * room.price_per_hour;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // validation
    const start = new Date(formData.start_datetime);
    const end = new Date(formData.end_datetime);
    const now = new Date();
    
    if (start <= now) {
      setError('La date de début doit être dans le futur');
      return;
    }
    
    if (end <= start) {
      setError('La date de fin doit être après la date de début');
      return;
    }
    
    if (calculateDuration() < 1) {
      setError('La réservation doit durer au moins 1 heure');
      return;
    }

    setSubmitting(true);
    try {
      const bookingData = {
        room_id: parseInt(id),
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime
      };
      
      const response = await bookingAPI.create(bookingData);
      
      if (response.success) {
        setSuccess('Réservation confirmée ! Redirection...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      setError(error.message || 'Erreur lors de la réservation');
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

  if (!room) {
    return (
      <div className="main-content">
        <div className="card">
          <h2>Salle non trouvée</h2>
          <button onClick={() => navigate('/rooms')} className="btn btn-primary">
            Retour aux salles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="card">
        <h1>Réservation : {room.title}</h1>
        <p className="subtitle">
          Lieu {room.city} • Capacité {room.capacity} pers. • Prix {room.price_per_hour}€/h
        </p>
      </div>

      <div className="card">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <div className="booking-container">
          <div className="room-summary">
            <h3>Récapitulatif</h3>
            <p><strong>Salle:</strong> {room.title}</p>
            <p><strong>Prix:</strong> {room.price_per_hour}DA par heure</p>
            <p><strong>Capacité:</strong> {room.capacity} personnes</p>
            <p><strong>Adresse:</strong> {room.address}, {room.city}</p>
          </div>

          <form onSubmit={handleSubmit} className="booking-form">
            <h3>Détails de la réservation</h3>
            
            <div className="form-group">
              <label className="form-label">Date et heure de début *</label>
              <input
                type="datetime-local"
                name="start_datetime"
                className="form-input"
                value={formData.start_datetime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date et heure de fin *</label>
              <input
                type="datetime-local"
                name="end_datetime"
                className="form-input"
                value={formData.end_datetime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optionnel)</label>
              <textarea
                name="notes"
                className="form-input"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Demandes particulières..."
              />
            </div>

            <div className="price-summary">
              <h4>Total</h4>
              <p>Durée: {calculateDuration().toFixed(1)} heures</p>
              <p>Prix total: <strong>{calculateTotal().toFixed(2)}DA</strong></p>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? 'Confirmation...' : 'Confirmer la réservation'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <button onClick={() => navigate(`/rooms/${id}`)} className="btn btn-secondary">
          ← Retour aux détails de la salle
        </button>
      </div>
    </div>
  );
};

export default Booking;