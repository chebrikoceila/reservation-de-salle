const pool = require('../config/database');
const moment = require('moment');

const Booking = {
  // Créer une réservation
  create: async (bookingData) => {
    const { client_id, room_id, start_datetime, end_datetime, total_price } = bookingData;
    
    const [result] = await pool.execute(
      `INSERT INTO bookings 
       (client_id, room_id, start_datetime, end_datetime, total_price, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [client_id, room_id, start_datetime, end_datetime, total_price]
    );
    
    return { id: result.insertId, ...bookingData, status: 'pending' };
  },

  // Trouver par ID
  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT b.*, 
              r.title as room_title,
              r.price_per_hour,
              u1.first_name as client_first_name,
              u1.last_name as client_last_name,
              u2.first_name as owner_first_name,
              u2.last_name as owner_last_name
       FROM bookings b
       INNER JOIN rooms r ON b.room_id = r.id
       INNER JOIN users u1 ON b.client_id = u1.id
       INNER JOIN users u2 ON r.owner_id = u2.id
       WHERE b.id = ?`,
      [id]
    );
    return rows[0];
  },

  // Réservations d'un client
  findByClient: async (clientId, status = null) => {
    let query = `
      SELECT b.*, 
             r.title as room_title,
             r.address,
             r.city,
             r.images,
             rv.rating,
             rv.comment
      FROM bookings b
      INNER JOIN rooms r ON b.room_id = r.id
      LEFT JOIN reviews rv ON b.id = rv.booking_id
      WHERE b.client_id = ?
    `;
    
    const params = [clientId];
    
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY b.start_datetime DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  // Réservations d'une salle 
  findByRoomOwner: async (ownerId, status = null) => {
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
    
    const params = [ownerId];
    
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  // Vérifier disponibilité
  checkAvailability: async (roomId, startDate, endDate, excludeBookingId = null) => {
    let query = `
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE room_id = ? 
        AND status IN ('pending', 'confirmed')
        AND (
          (start_datetime BETWEEN ? AND ?)
          OR (end_datetime BETWEEN ? AND ?)
          OR (? BETWEEN start_datetime AND end_datetime)
          OR (? BETWEEN start_datetime AND end_datetime)
        )
    `;
    
    const params = [roomId, startDate, endDate, startDate, endDate, startDate, endDate];
    
    if (excludeBookingId) {
      query += ' AND id != ?';
      params.push(excludeBookingId);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows[0].count === 0;
  },

  // Mettre à jour le statut
  updateStatus: async (bookingId, status) => {
    const [result] = await pool.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, bookingId]
    );
    return result.affectedRows > 0;
  },

  // Annuler une réservation
  cancel: async (bookingId, clientId = null) => {
    let query = 'UPDATE bookings SET status = "cancelled" WHERE id = ?';
    const params = [bookingId];
    
    if (clientId) {
      query += ' AND client_id = ?';
      params.push(clientId);
    }
    
    const [result] = await pool.execute(query, params);
    return result.affectedRows > 0;
  },

  // Statistiques
  getStats: async (ownerId = null) => {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(total_price) as total_revenue
      FROM bookings b
    `;
    
    const params = [];
    
    if (ownerId) {
      query += ' INNER JOIN rooms r ON b.room_id = r.id WHERE r.owner_id = ?';
      params.push(ownerId);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows[0];
  }
};

const updateBookingStatus = async () => {
  try {
    // Mettre à jour les réservations 
    const [result] = await pool.execute(
      `UPDATE bookings 
       SET status = 'completed' 
       WHERE status = 'confirmed' 
       AND end_datetime < NOW()`
    );
    
    if (result.affectedRows > 0) {
      console.log(`${result.affectedRows} réservations mises à jour en "completed"`);
    }
    
    return result.affectedRows;
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    return 0;
  }
};
module.exports.updateBookingStatus = updateBookingStatus;

module.exports = Booking;