import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { roomAPI, bookingAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // verifier si cest un admin

  if (user && user.role !== 'admin') {
    if (user.role === 'client') {
      return <Navigate to="/client/dashboard" />;
    }
    if (user.role === 'owner') {
      return <Navigate to="/owner/dashboard" />;
    }
    return <Navigate to="/" />;
  }

  const [users, setUsers] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState({
    users: true,
    rooms: true,
    bookings: true
  });
  const [activeTab, setActiveTab] = useState('users');
  
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    await Promise.all([
      fetchAllUsers(),
      fetchAllRooms(),
      fetchAllBookings()
    ]);
  };

  const fetchAllUsers = async () => {
    try {
      console.log(' Fetching users');
      const response = await adminAPI.getAllUsers();
      console.log('Users response:', response);
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      
      try {
        const fallbackResponse = await roomAPI.getAll();
        
        setUsers([]);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchAllRooms = async () => {
    try {
      const response = await roomAPI.getAll({ limit: 100 });
      setAllRooms(response.data?.rooms || []);
    } catch (error) {
      console.error('Erreur chargement salles:', error);
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  };

  const fetchAllBookings = async () => {
    try {
      
      try {
        const response = await bookingAPI.getAll();
        setAllBookings(response.data?.bookings || []);
      } catch (error1) {
        console.log('Première route booking échouée, essai autre...');
        
        const response = await bookingAPI.getOwnerBookings();
        setAllBookings(response.data?.bookings || []);
      }
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
      setAllBookings([]);
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  };

// fonction pour supprimer un utilisateur

const handleDeleteUser = async (userId, userEmail) => {

  // si le meme compte de l'utilisateur actuele
  if (userId === user?.id) {
    alert(' Vous ne pouvez pas supprimer votre propre compte !');
    return;
  }
  
  if (!window.confirm(`etes-vous sûr de vouloir supprimer l'utilisateur "${userEmail}" ?\n\n Cette action supprimera egalement toutes ses données.`)) return;
  
  try {
    const response = await adminAPI.deleteUser(userId);
    if (response.success) {

      
      setUsers(users.filter(u => u.id !== userId));
      alert(response.message);
      
      
      const deletedUser = users.find(u => u.id === userId);
      if (deletedUser?.role === 'owner') {
        fetchAllRooms();
      }
      
      
      if (deletedUser?.role === 'client') {
        fetchAllBookings();
      }
    } else {
      alert (response.message || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    alert (error.message || 'Erreur lors de la suppression');
  }
};




  const handleUpdateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Changer le rôle de cet utilisateur en "${newRole}" ?`)) return;
    
    try {
      const response = await adminAPI.updateUserRole(userId, { role: newRole });
      if (response.success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
      }
    } catch (error) {
      console.error('Erreur mise à jour rôle:', error);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Supprimer cette salle ?')) return;
    
    try {
      const response = await roomAPI.delete(roomId);
      if (response.success) {
        setAllRooms(allRooms.filter(r => r.id !== roomId));
      }
    } catch (error) {
      console.error('Erreur suppression salle:', error);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Supprimer cette réservation ?')) return;
    
    try {
      const response = await bookingAPI.delete(bookingId);
      if (response.success) {
        setAllBookings(allBookings.filter(b => b.id !== bookingId));
      }
    } catch (error) {
      console.error('Erreur suppression réservation:', error);
    }
  };

  return (


    <div className="main-content">
      <div className="card">
        <h1>🛡️ Administration</h1>
        <p>Gestion complète de la plateforme</p>
        <p>Connecté en tant que (Admin): <strong>{user?.email}</strong>.</p>
      </div>

  
      <div className="card">
        <div className="tabs">

          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Utilisateurs ({users.length})
          </button>


          <button 
            className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
             Salles ({allRooms.length})
          </button>


          <button 
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
             Réservations ({allBookings.length})
          </button>

        </div>
      </div>



      
      <div className="card">
        {activeTab === 'users' && (
          <>
            <h2>Gestion des utilisateurs</h2>
            {loading.users ? (
              <p>Chargement des utilisateurs...</p>
            ) : users.length > 0 ? (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Inscrit le</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(userItem => (
                      <tr key={userItem.id}>
                        <td>{userItem.id}</td>
                        <td>{userItem.first_name} {userItem.last_name}</td>
                        <td>{userItem.email}</td>
                        
                         <td>
                           {(() => {
                                const dateStr = userItem.created_at;
                                if (!dateStr) return 'N/A';
    
                                 // pour extraire YYYY-MM-DD de n'importe quel format

                                   const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
                                    if (match) {
                                      const [_, year, month, day] = match;
                                      return `${day}/${month}/${year}`;
                                    }
    
                                return dateStr;
                             })()}
                          </td>
                        <td>
                          <span className={`role-badge ${userItem.role}`}>
                               {userItem.role === 'client' ? ' Client' : 
                                 userItem.role === 'owner' ? ' Propriétaire' : 
                                 'Administrateur'}
                          </span>
                        </td>
                          <td>
                           <button 
                             onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                             className="btn btn-danger btn-sm"
                             disabled={userItem.id === user?.id}
                             title={userItem.id === user?.id ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer cet utilisateur"}
                           >
                             Supprimer
                           </button>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                <p>Aucun utilisateur trouvé dans la base de données.</p>
                <p>Vérifiez la console pour les erreurs d'API.</p>
                <button onClick={fetchAllUsers} className="btn btn-secondary">
                  Réessayer
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'rooms' && (
          <>
            <h2>Gestion des salles</h2>
            {loading.rooms ? (
              <p>Chargement des salles...</p>
            ) : allRooms.length > 0 ? (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Titre</th>
                      <th>Propriétaire</th>
                      <th>Ville</th>
                      <th>Capacité</th>
                      <th>Prix</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRooms.map(room => (
                      <tr key={room.id}>
                        <td>{room.id}</td>
                        <td>{room.title}</td>
                        <td>{room.owner_first_name} {room.owner_last_name}</td>
                        <td>{room.city}</td>
                        <td>{room.capacity}</td>
                        <td>{room.price_per_hour}DA</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteRoom(room.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Aucune salle trouvée.</p>
            )}
          </>
        )}

        {activeTab === 'bookings' && (
          <>
            <h2>Gestion des réservations</h2>
            {loading.bookings ? (
              <p>Chargement des réservations...</p>
            ) : allBookings.length > 0 ? (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Client</th>
                      <th>Salle</th>
                      <th>Dates</th>
                      <th>Prix</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map(booking => (
                      <tr key={booking.id}>
                        <td>{booking.id}</td>
                        <td>{booking.client_first_name} {booking.client_last_name}</td>
                        <td>{booking.room_title}</td>
                        <td>
                          {new Date(booking.start_datetime).toLocaleDateString('fr-FR')}
                          <br />
                          au {new Date(booking.end_datetime).toLocaleDateString('fr-FR')}
                        </td>
                        <td>{booking.total_price}DA</td>
                        <td>
                          <span className={`status-badge ${booking.status}`}>
                            {booking.status === 'confirmed' ? 'Confirmée' :
                             booking.status === 'pending' ? 'En attente' :
                             booking.status === 'cancelled' ? 'Annulée' : booking.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Aucune réservation trouvée.</p>
            )}
          </>
        )}
      </div>

      
      <div className="card">
        <h3> Statistiques globales</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{users.length}</h3>
            <p>Utilisateurs</p>
          </div>
          <div className="stat-card">
            <h3>{allRooms.length}</h3>
            <p>Salles</p>
          </div>
          <div className="stat-card">
            <h3>{allBookings.length}</h3>
            <p>Réservations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;