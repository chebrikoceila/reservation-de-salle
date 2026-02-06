import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rediriger si ce n'est pas un client
  if (user && user.role !== 'client') {
    if (user.role === 'owner') {
      return <Navigate to="/owner/dashboard" />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    }
  }

  useEffect(() => {
    if (user && user.role === 'client') {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Annuler cette réservation ?')) return;
    
    try {
      const response = await bookingAPI.cancel(bookingId);
      if (response.success) {
        setBookings(bookings.filter(b => b.id !== bookingId));
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
    }
  };

  return (
    <div className="main-content">
      <div className="card">
        <h1>Mon compte Client</h1>
        <p>Bienvenue, <strong>{user?.first_name} {user?.last_name}</strong></p>
        <p>Email: {user?.email} • Rôle: Client</p>
      </div>

      <div className="card">
        <h2>Mes réservations ({bookings.length})</h2>
        
        {loading ? (
          <p>Chargement des réservations...</p>
        ) : bookings.length > 0 ? (
          <div className="bookings-list">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Salle</th>
                  <th>Date de début</th>
                  <th>Date de fin</th>
                  <th>Prix total</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.room_title}</td>
                    <td>{new Date(booking.start_datetime).toLocaleString('fr-FR')}</td>
                    <td>{new Date(booking.end_datetime).toLocaleString('fr-FR')}</td>
                    <td>{booking.total_price}DA</td>
                    <td>
                      <span className={`status-badge status-${booking.status}`}>
                        {booking.status === 'confirmed' ? 'Confirmée' :
                         booking.status === 'pending' ? 'En attente' :
                         booking.status === 'cancelled' ? 'Annulée' : booking.status}
                      </span>
                    </td>
                    <td>
                      {booking.status === 'pending' && (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>Vous n'avez aucune réservation.</p>
            <Link to="/rooms" className="btn btn-primary">
              Réserver une salle
            </Link>
          </div>
        )}
      </div>

      <div className="card">
       
        <div className="quick-actions">
          <Link to="/rooms" className="btn btn-primary">
            Voir les salles disponibles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;