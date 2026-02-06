const pool = require('../config/database');

const Room = {
  // Trouver par ID avec détails
  findById: async (id) => {
    const [rows] = await pool.execute(`
      SELECT r.*, 
             u.first_name as owner_first_name, 
             u.last_name as owner_last_name,
             u.email as owner_email,
             AVG(rev.rating) as average_rating,
             COUNT(rev.id) as review_count
      FROM rooms r
      LEFT JOIN users u ON r.owner_id = u.id
      LEFT JOIN reviews rev ON r.id = rev.room_id
      WHERE r.id = ?
      GROUP BY r.id
    `, [id]);
    
    if (!rows[0]) return null;
    
    // Images de la salle
    const [images] = await pool.execute(
      'SELECT * FROM room_images WHERE room_id = ? ORDER BY is_main DESC',
      [id]
    );
    
    
    let amenities = [];
    try {
      amenities = rows[0].amenities ? JSON.parse(rows[0].amenities) : [];
    } catch (e) {
      amenities = [];
    }
    
    return {
      ...rows[0],
      amenities,
      images,
      average_rating: rows[0].average_rating ? parseFloat(rows[0].average_rating) : 0
    };
  },

  // Recherche avec filtres
  search: async (filters = {}, page = 1, limit = 12) => {
    const offset = (page - 1) * limit;
    let query = `
      SELECT r.*, 
             u.first_name as owner_first_name,
             u.last_name as owner_last_name,
             (SELECT image_url FROM room_images WHERE room_id = r.id AND is_main = 1 LIMIT 1) as main_image,
             AVG(rev.rating) as average_rating
      FROM rooms r
      LEFT JOIN users u ON r.owner_id = u.id
      LEFT JOIN reviews rev ON r.id = rev.room_id
      WHERE r.is_available = 1
    `;
    
    const params = [];
    
    if (filters.city) {
      query += ' AND r.city LIKE ?';
      params.push(`%${filters.city}%`);
    }
    
    if (filters.country) {
      query += ' AND r.country = ?';
      params.push(filters.country);
    }
    
    if (filters.minCapacity) {
      query += ' AND r.capacity >= ?';
      params.push(filters.minCapacity);
    }
    
    if (filters.maxCapacity) {
      query += ' AND r.capacity <= ?';
      params.push(filters.maxCapacity);
    }
    
    if (filters.minPrice) {
      query += ' AND r.price_per_hour >= ?';
      params.push(filters.minPrice);
    }
    
    if (filters.maxPrice) {
      query += ' AND r.price_per_hour <= ?';
      params.push(filters.maxPrice);
    }
    
    if (filters.amenities && filters.amenities.length > 0) {
      query += ' AND JSON_CONTAINS(r.amenities, ?)';
      params.push(JSON.stringify(filters.amenities));
    }
    
    query += ' GROUP BY r.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rooms] = await pool.execute(query, params);
    
    
    let countQuery = 'SELECT COUNT(DISTINCT r.id) as total FROM rooms r WHERE r.is_available = 1';
    const countParams = [];
    

    if (filters.city) {
      countQuery += ' AND r.city LIKE ?';
      countParams.push(`%${filters.city}%`);
    }
    
    if (filters.minCapacity) {
      countQuery += ' AND r.capacity >= ?';
      countParams.push(filters.minCapacity);
    }
    
    if (filters.minPrice) {
      countQuery += ' AND r.price_per_hour >= ?';
      countParams.push(filters.minPrice);
    }
    
    const [countRows] = await pool.execute(countQuery, countParams);
    
    return {
      rooms,
      total: countRows[0].total,
      page,
      limit,
      totalPages: Math.ceil(countRows[0].total / limit)
    };
  },

  // Créer une salle
  create: async (roomData) => {
    const {
      owner_id, title, description, capacity, price_per_hour,
      address, city, postal_code, country, latitude, longitude,
      amenities = []
    } = roomData;
    
    const [result] = await pool.execute(`
      INSERT INTO rooms (
        owner_id, title, description, capacity, price_per_hour,
        address, city, postal_code, country, latitude, longitude, amenities
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      owner_id, title, description || null, capacity, price_per_hour,
      address, city, postal_code, country, latitude || null, longitude || null,
      JSON.stringify(amenities)
    ]);
    
    return { id: result.insertId, ...roomData };
  },

  // Mettre à jour
  update: async (id, updateData) => {
    const fields = [];
    const values = [];
    
    const allowedFields = [
      'title', 'description', 'capacity', 'price_per_hour',
      'address', 'city', 'postal_code', 'country',
      'latitude', 'longitude', 'amenities', 'is_available'
    ];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = ?`);
        if (field === 'amenities') {
          values.push(JSON.stringify(updateData[field]));
        } else {
          values.push(updateData[field]);
        }
      }
    });
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const query = `UPDATE rooms SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
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

  // Salles d'un propriétaire
  findByOwner: async (ownerId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    const [rooms] = await pool.execute(`
      SELECT r.*, 
             COUNT(b.id) as booking_count,
             AVG(rev.rating) as average_rating
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id
      LEFT JOIN reviews rev ON r.id = rev.room_id
      WHERE r.owner_id = ?
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [ownerId, limit, offset]);
    
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) as total FROM rooms WHERE owner_id = ?',
      [ownerId]
    );
    
    return {
      rooms,
      total: countRows[0].total,
      page,
      limit,
      totalPages: Math.ceil(countRows[0].total / limit)
    };
  },

  // Statistiques pour propriétaire
  getOwnerStats: async (ownerId) => {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT r.id) as total_rooms,
        SUM(CASE WHEN r.is_available = 1 THEN 1 ELSE 0 END) as available_rooms,
        COUNT(DISTINCT b.id) as total_bookings,
        SUM(b.total_price) as total_revenue,
        AVG(rev.rating) as average_rating
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id AND b.status = 'confirmed'
      LEFT JOIN reviews rev ON r.id = rev.room_id
      WHERE r.owner_id = ?
    `, [ownerId]);
    
    return stats[0];
  }
};

module.exports = Room;