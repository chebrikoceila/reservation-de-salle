import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  
  const getUserDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'client': return '/client/dashboard';
      case 'owner': return '/owner/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/';
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
           Réservation de Salles
        </Link>
        
        <nav className="nav-links">
          <Link to="/" className="nav-link">Accueil</Link>
          <Link to="/rooms" className="nav-link">Salles</Link>
          
          {user ? (
            <>
             { /* lien vers le dashboard approprie */}
              <Link to={getUserDashboardLink()} className="nav-link">
                {user.role === 'admin' ? 'Administration' : 
                 user.role === 'owner' ? 'Espace Propriétaire' : 'Mon compte'}
              </Link>

              <button onClick={handleLogout} className="btn btn-secondary">
                Déconnexion
              </button>
              <span className="user-greeting">
                {user.first_name} ({user.role})
              </span>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Connexion</Link>
              <Link to="/register" className="btn btn-primary">Inscription</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;