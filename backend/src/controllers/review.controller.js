
const pool = require('../config/database');
const Review = require('../models/review.model');

// Créer un avis 
exports.createReview = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;
    const client_id = req.user.id;
    
    console.log('Création avis - Données:', { booking_id, rating, comment, client_id });
    
    
    if (!booking_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'ID de réservation et note sont requis'
      });
    }
    
    // Vérifier que la réservation existe
    const [bookingRows] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [booking_id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    const booking = bookingRows[0];
    
    // Vérifier que la réservation appartient au client
    if (booking.client_id !== client_id) {
      return res.status(403).json({
        success: false,
        message: 'Cette réservation ne vous appartient pas'
      });
    }
    
    // Vérifier que la réservation est terminée
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez noter que les réservations terminées. Statut actuel: ' + booking.status
      });
    }
    
    // Vérifier si un avis existe déjà pour cette réservation
    const [existingReview] = await pool.execute(
      'SELECT * FROM reviews WHERE booking_id = ?',
      [booking_id]
    );
    
    if (existingReview.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà noté cette réservation'
      });
    }
    
    // Créer l'avis
    const [result] = await pool.execute(
      'INSERT INTO reviews (booking_id, client_id, room_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [booking_id, client_id, booking.room_id, rating, comment || null]
    );
    
    console.log('Avis créé avec ID:', result.insertId);
    
    res.status(201).json({
      success: true,
      message: 'Avis publié avec succès',
      data: {
        review: {
          id: result.insertId,
          booking_id,
          client_id,
          room_id: booking.room_id,
          rating,
          comment
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur création avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
};

// Obtenir les avis d'une salle
exports.getRoomReviews = async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log('Récupération avis pour salle:', roomId);
    
    const [reviews] = await pool.execute(
      `SELECT r.*, u.first_name, u.last_name 
       FROM reviews r
       INNER JOIN users u ON r.client_id = u.id
       WHERE r.room_id = ?
       ORDER BY r.created_at DESC`,
      [roomId]
    );
    
    res.json({
      success: true,
      data: {
        reviews: reviews,
        total: reviews.length
      }
    });
    
  } catch (error) {
    console.error('Erreur avis salle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les avis d'un client
exports.getClientReviews = async (req, res) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT r.*, ro.title as room_title
       FROM reviews r
       INNER JOIN rooms ro ON r.room_id = ro.id
       WHERE r.client_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: { reviews }
    });
    
  } catch (error) {
    console.error('Erreur avis client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les avis pour les salles d'un propriétaire
exports.getOwnerReviews = async (req, res) => {
  try {
    const [reviews] = await pool.execute(
      `SELECT rv.*, 
              ro.title as room_title,
              u.first_name as client_first_name,
              u.last_name as client_last_name
       FROM reviews rv
       INNER JOIN rooms ro ON rv.room_id = ro.id
       INNER JOIN users u ON rv.client_id = u.id
       WHERE ro.owner_id = ?
       ORDER BY rv.created_at DESC`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: { reviews }
    });
    
  } catch (error) {
    console.error('Erreur avis propriétaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};