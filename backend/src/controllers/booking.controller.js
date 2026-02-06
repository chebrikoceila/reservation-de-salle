const pool = require('../config/database');
const moment = require('moment');

// Créer une réservation (client)
exports.createBooking = async (req, res) => {
  try {
    const { room_id, start_datetime, end_datetime } = req.body;
    const client_id = req.user.id;
    
    // Vérifier que la salle existe
    const [roomRows] = await pool.execute(
      'SELECT * FROM rooms WHERE id = ?',
      [room_id]
    );
    
    if (roomRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    const room = roomRows[0];
    
    if (!room.is_available) {
      return res.status(400).json({
        success: false,
        message: 'Cette salle n\'est pas disponible'
      });
    }
    
    // Vérifier les dates
    const startDate = new Date(start_datetime);
    const endDate = new Date(end_datetime);
    const now = new Date();
    
    if (startDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'La date de début doit être dans le futur'
      });
    }
    
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'La date de fin doit être après la date de début'
      });
    }
    
    // Vérifier la disponibilité 
    const [existingBookings] = await pool.execute(
      `SELECT * FROM bookings 
       WHERE room_id = ? 
         AND status IN ('pending', 'confirmed')
         AND (
           (start_datetime BETWEEN ? AND ?)
           OR (end_datetime BETWEEN ? AND ?)
           OR (? BETWEEN start_datetime AND end_datetime)
         )`,
      [room_id, start_datetime, end_datetime, start_datetime, end_datetime, start_datetime]
    );
    
    if (existingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'La salle n\'est pas disponible pour ces dates'
      });
    }
    
    // Calculer le prix total
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    const total_price = durationHours * room.price_per_hour;
    
    // Créer la réservation
    const [result] = await pool.execute(
      `INSERT INTO bookings (client_id, room_id, start_datetime, end_datetime, total_price, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [client_id, room_id, start_datetime, end_datetime, total_price]
    );
    
    const booking = {
      id: result.insertId,
      client_id,
      room_id,
      start_datetime,
      end_datetime,
      total_price,
      status: 'pending'
    };
    
    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: { booking }
    });
    
  } catch (error) {
    console.error('Erreur création réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de réservation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir les réservations d'un client
exports.getClientBookings = async (req, res) => {
  try {
    const client_id = req.user.id;
    const status = req.query.status;
    
    let query = `
      SELECT b.*, 
             r.title as room_title,
             r.address,
             r.city,
             r.price_per_hour
      FROM bookings b
      INNER JOIN rooms r ON b.room_id = r.id
      WHERE b.client_id = ?
    `;
    
    const params = [client_id];
    
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY b.start_datetime DESC';
    
    const [bookings] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: { bookings }
    });
    
  } catch (error) {
    console.error('Erreur réservations client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les réservations pour les salles d'un propriétaire
exports.getOwnerBookings = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const status = req.query.status;
    
    let query = `
      SELECT b.*, 
             r.title as room_title,
             u.first_name as client_first_name,
             u.last_name as client_last_name,
             u.email as client_email
      FROM bookings b
      INNER JOIN rooms r ON b.room_id = r.id
      INNER JOIN users u ON b.client_id = u.id
      WHERE r.owner_id = ?
    `;
    
    const params = [owner_id];
    
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    const [bookings] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: { bookings }
    });
    
  } catch (error) {
    console.error('Erreur réservations propriétaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Annuler une réservation avant la confirmation du proparieter (client)
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.user.id;
    
    // Vérifier si la réservation appartient au client
    const [bookingRows] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ? AND client_id = ?',
      [id, client_id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée ou vous n\'êtes pas autorisé'
      });
    }
    
    // Annuler la réservation
    const [result] = await pool.execute(
      'UPDATE bookings SET status = "cancelled" WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Échec de l\'annulation'
      });
    }
    
    res.json({
      success: true,
      message: 'Réservation annulée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur annulation réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Confirmer une réservation (propriétaire)
exports.confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const owner_id = req.user.id;
    
    // Vérifier si la réservation est pour une salle du propriétaire
    const [bookingRows] = await pool.execute(
      `SELECT b.* 
       FROM bookings b
       INNER JOIN rooms r ON b.room_id = r.id
       WHERE b.id = ? AND r.owner_id = ?`,
      [id, owner_id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée ou vous n\'êtes pas le propriétaire'
      });
    }
    
    // Confirmer la réservation
    const [result] = await pool.execute(
      'UPDATE bookings SET status = "confirmed" WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Échec de la confirmation'
      });
    }
    
    res.json({
      success: true,
      message: 'Réservation confirmée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur confirmation réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer une réservation (admin seulement)
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM bookings WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Réservation supprimée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur suppression réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir toutes les réservations (pour admin)
exports.getAllBookings = async (req, res) => {
  try {
    console.log(' GET /api/bookings/all - Admin request');
    
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Admin seulement.'
      });
    }

    const [rows] = await pool.execute(
      `SELECT 
        b.*,
        r.title as room_title,
        u1.first_name as client_first_name,
        u1.last_name as client_last_name,
        u2.first_name as owner_first_name,
        u2.last_name as owner_last_name
       FROM bookings b
       INNER JOIN rooms r ON b.room_id = r.id
       INNER JOIN users u1 ON b.client_id = u1.id
       INNER JOIN users u2 ON r.owner_id = u2.id
       ORDER BY b.created_at DESC`
    );
    
    console.log(`${rows.length} réservations trouvées pour admin`);
    
    res.json({
      success: true,
      data: {
        bookings: rows,
        total: rows.length
      }
    });
    
  } catch (error) {
    console.error(' Erreur liste réservations admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
};

// Statistiques de réservation
exports.getBookingStats = async (req, res) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(total_price) as total_revenue
      FROM bookings
    `;
    
    const params = [];
    
    if (req.user.role === 'owner') {
      query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          SUM(b.total_price) as total_revenue
        FROM bookings b
        INNER JOIN rooms r ON b.room_id = r.id
        WHERE r.owner_id = ?
      `;
      params.push(req.user.id);
    }
    
    const [statsRows] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: { stats: statsRows[0] }
    });
    
  } catch (error) {
    console.error('Erreur statistiques réservations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Refuser une réservation (en tant que propriétaire)
exports.rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Tentative de refus de la réservation ${id} par l'utilisateur ${req.user.id}`);
    
    // Vérifier si la réservation existe
    const [bookingRows] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );
    
    if (bookingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }
    
    const booking = bookingRows[0];
    console.log('Réservation trouvée:', booking);
    
    // Vérifier si l'utilisateur est propriétaire de la salle
    const [roomRows] = await pool.execute(
      'SELECT owner_id FROM rooms WHERE id = ?',
      [booking.room_id]
    );
    
    if (roomRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    const room = roomRows[0];
    console.log('Salle trouvée, propriétaire:', room.owner_id);
    
    if (room.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas le propriétaire de cette salle'
      });
    }
    
    // Vérifier que la réservation est en attente
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Seules les réservations en attente peuvent être refusées. Statut actuel: ${booking.status}`
      });
    }
    
    // Mettre à jour le statut
    const [result] = await pool.execute(
      'UPDATE bookings SET status = "cancelled" WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Échec de la mise à jour'
      });
    }
    
    console.log(`Réservation ${id} refusée avec succès`);
    
    res.json({
      success: true,
      message: 'Réservation refusée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur refus réservation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
};