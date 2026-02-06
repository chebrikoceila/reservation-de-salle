const pool = require('../config/database');

const Review = {
  // Créer un avis
  create: async (reviewData) => {
    const { booking_id, client_id, room_id, rating, comment } = reviewData;
    
    const [result] = await pool.execute(
      'INSERT INTO reviews (booking_id, client_id, room_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [booking_id, client_id, room_id, rating, comment]
    );
    
    return { id: result.insertId, ...reviewData };
  },

  // Trouver par booking
  findByBooking: async (bookingId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM reviews WHERE booking_id = ?',
      [bookingId]
    );
    return rows[0];
  },

  // Avis d'une salle
  findByRoom: async (roomId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    const [rows] = await pool.execute(
      `SELECT rv.*, 
              u.first_name, 
              u.last_name,
              b.start_datetime
       FROM reviews rv
       INNER JOIN users u ON rv.client_id = u.id
       INNER JOIN bookings b ON rv.booking_id = b.id
       WHERE rv.room_id = ?
       ORDER BY rv.created_at DESC
       LIMIT ? OFFSET ?`,
      [roomId, limit, offset]
    );
    
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) as total FROM reviews WHERE room_id = ?',
      [roomId]
    );
    
    const [avgRows] = await pool.execute(
      'SELECT AVG(rating) as average FROM reviews WHERE room_id = ?',
      [roomId]
    );
    
    return {
      reviews: rows,
      total: countRows[0].total,
      average: avgRows[0].average || 0,
      page,
      limit
    };
  },

  // Avis d'un client
  findByClient: async (clientId) => {
    const [rows] = await pool.execute(
      `SELECT rv.*, 
              r.title as room_title
       FROM reviews rv
       INNER JOIN rooms r ON rv.room_id = r.id
       WHERE rv.client_id = ?
       ORDER BY rv.created_at DESC`,
      [clientId]
    );
    return rows;
  },

  // Vérifier si le client a réservé la salle
  hasBookedRoom: async (clientId, roomId) => {
    const [rows] = await pool.execute(
      `SELECT b.id 
       FROM bookings b
       WHERE b.client_id = ? 
         AND b.room_id = ? 
         AND b.status = 'completed'`,
      [clientId, roomId]
    );
    return rows.length > 0;
  }
};

module.exports = Review;