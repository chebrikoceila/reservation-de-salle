const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importer les routes
const authRoutes = require('./routes/auth.routes');
const roomRoutes = require('./routes/room.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware pour mettre à jour les statuts avant de chaque requête
app.use(async (req, res, next) => {
  // Mettre à jour les statuts seulement pour les requêtes API 
  if (req.path.startsWith('/api/')) {
    try {
      const pool = require('./config/database');
      
      // Mettre à jour les réservations passées en "completed"----> terminer
      const [result] = await pool.execute(
        `UPDATE bookings 
         SET status = 'completed' 
         WHERE status = 'confirmed' 
         AND end_datetime < NOW()`
      );
      
      if (result.affectedRows > 0) {
        console.log(` ${result.affectedRows} réservations mises à jour en "completed"`);
      }
    } catch (error) {
      console.error(' Erreur mise à jour statut:', error);
    }
  }
  next();
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Reservation de Salles en ligne',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Route d'accueil
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API de Réservation de Salles',
    endpoints: {
      auth: '/api/auth',
      rooms: '/api/rooms',
      bookings: '/api/bookings',
      reviews: '/api/reviews',
      documentation: 'À venir'
    }
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Fichier trop volumineux (max 5MB)'
    });
  }
  
  if (err.message.includes('image')) {
    return res.status(400).json({
      success: false,
      message: 'Type de fichier non autorisé. Seules les images sont acceptées.'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(` Serveur démarré sur le port ${PORT}`);
  console.log(` Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Base de données: ${process.env.DB_NAME}`);
  console.log('='.repeat(50));
  console.log('Endpoints disponibles:');
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  POST http://localhost:${PORT}/api/auth/register`);
  console.log(`  POST http://localhost:${PORT}/api/auth/login`);
  console.log(`  GET  http://localhost:${PORT}/api/rooms`);
  console.log('='.repeat(50));
});