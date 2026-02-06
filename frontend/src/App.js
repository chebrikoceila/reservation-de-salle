import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedDashboard from './components/RoleBasedDashboard';

// Composants
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RoomList from './pages/RoomList';
import RoomDetail from './pages/RoomDetail';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateReview from './pages/CreateReview';

// Styles
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Header />
          
          <main className="main-content">
            <Routes>
              
              {/* Routes publiques */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/rooms" element={<RoomList />} />
              <Route path="/rooms/:id" element={<RoomDetail />} />
              
              {/* Routes protégées */}
              <Route path="/booking/:id" element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              } />
              
              {/* Routes avec rôles spécifiques */}
              <Route path="/client/dashboard" element={
                <ProtectedRoute roles={['client']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/owner/dashboard" element={
                <ProtectedRoute roles={['owner']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/dashboard" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/reviews/create/:roomId" element={
                <ProtectedRoute>
                <CreateReview />
                </ProtectedRoute>
              } />


              {/* Route qui redirige selon le rôle */}
              <Route path="/dashboard" element={<RoleBasedDashboard />} />
              
              {/* Route par défaut */}
              <Route path="*" element={<Navigate to="/" />} />

            </Routes>
          </main>
          
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;