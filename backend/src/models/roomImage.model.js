const pool = require('../config/database');

const Room = {
  // Trouver toutes les salles
  findAll: async (filters = {}, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM rooms WHERE is_available = 1';
    const params = [];
    
    if (filters.city) {
      query += ' AND city LIKE ?';
      params.push(`%${filters.city}%`);
    }
    
    if (filters.minPrice) {
      query += ' AND price_per_hour >= ?';
      params.push(filters.minPrice);
    }
    
    if (filters.maxPrice) {
      query += ' AND price_per_hour <= ?';
      params.push(filters.maxPrice);
    }
    
    if (filters.minCapacity) {
      query += ' AND capacity >= ?';
      params.push(filters.minCapacity);
    }
    
    if (filters.owner_id) {
      query += ' AND owner_id = ?';
      params.push(filters.owner_id);
    }
    
    // Ajout pour la pagination
    const countParams = [...params];
    const dataParams = [...params, limit, offset];
    
    // Compter le total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countRows] = await pool.execute(countQuery, countParams);
    
    // Récupérer les données
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const [rows] = await pool.execute(query, dataParams);
    
    return {
      rooms: rows,
      total: countRows[0].total,
      page,
      limit
    };
  },

  // Trouver par ID
  findById: async (id) => {
    const [rows] = await pool.execute(
      `SELECT r.*, 
              u.first_name as owner_first_name, 
              u.last_name as owner_last_name,
              u.email as owner_email
       FROM rooms r
       LEFT JOIN users u ON r.owner_id = u.id
       WHERE r.id = ?`,
      [id]
    );
    
    if (!rows[0]) return null;
    
    // Récupérer les images
    const [images] = await pool.execute(
      'SELECT * FROM room_images WHERE room_id = ?',
      [id]
    );
    
    // Récupérer les avis
    const [reviews] = await pool.execute(
      `SELECT rv.*, 
              u.first_name, 
              u.last_name
       FROM reviews rv
       LEFT JOIN users u ON rv.client_id = u.id
       WHERE rv.room_id = ?
       ORDER BY rv.created_at DESC`,
      [id]
    );
    
    // Calculer la note moyenne
    const [avgRating] = await pool.execute(
      'SELECT AVG(rating) as average FROM reviews WHERE room_id = ?',
      [id]
    );
    
    return {
      ...rows[0],
      images,
      reviews,
      average_rating: avgRating[0].average || 0
    };
  },

  // Créer une salle
  create: async (roomData) => {
    const {
      owner_id, title, description, capacity, price_per_hour,
      address, city, postal_code, country, latitude, longitude,
      amenities = []
    } = roomData;
    
    const [result] = await pool.execute(
      `INSERT INTO rooms (
        owner_id, title, description, capacity, price_per_hour,
        address, city, postal_code, country, latitude, longitude, amenities
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        owner_id, title, description, capacity, price_per_hour,
        address, city, postal_code, country, latitude || null, longitude || null,
        JSON.stringify(amenities)
      ]
    );
    
    return { id: result.insertId, ...roomData };
  },

  // Mettre à jour
  update: async (id, roomData) => {
    const fields = [];
    const values = [];
    
    const allowedFields = [
      'title', 'description', 'capacity', 'price_per_hour',
      'address', 'city', 'postal_code', 'country',
      'latitude', 'longitude', 'amenities', 'is_available'
    ];
    
    allowedFields.forEach(field => {
      if (roomData[field] !== undefined) {
        if (field === 'amenities') {
          fields.push(`${field} = ?`);
          values.push(JSON.stringify(roomData[field]));
        } else {
          fields.push(`${field} = ?`);
          values.push(roomData[field]);
        }
      }
    });
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const query = `UPDATE rooms SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    
    return result.affectedRows > 0;
  },

  // Supprimer
  delete: async (id) => {
    const [result] = await pool.execute(
      'DELETE FROM rooms WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  // Vérifier si le propriétaire
  isOwner: async (roomId, userId) => {
    const [rows] = await pool.execute(
      'SELECT id FROM rooms WHERE id = ? AND owner_id = ?',
      [roomId, userId]
    );
    return rows.length > 0;
  },

  // Statistiques pour propriétaire
  getOwnerStats: async (ownerId) => {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_rooms,
        SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available_rooms,
        AVG(price_per_hour) as avg_price
       FROM rooms 
       WHERE owner_id = ?`,
      [ownerId]
    );
    
    const [bookingStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_booking_price
       FROM bookings b
       INNER JOIN rooms r ON b.room_id = r.id
       WHERE r.owner_id = ? AND b.status = 'confirmed'`,
      [ownerId]
    );
    
    return {
      ...stats[0],
      ...bookingStats[0]
    };
  }
};

module.exports = Room;