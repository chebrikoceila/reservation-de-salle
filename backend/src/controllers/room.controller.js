const pool = require('../config/database');


exports.getAllRooms = async (req, res) => {
  console.log('GET /api/rooms - Query params:', req.query);
  
  try {
    let query = `
      SELECT r.*, 
             ri.image_url as main_image,
             ri.id as image_id
      FROM rooms r
      LEFT JOIN room_images ri ON r.id = ri.room_id AND ri.is_main = 1
      WHERE r.is_available = 1
    `;
    
    const params = [];
    
    // Filtre par ville
    if (req.query.city) {
      query += ' AND r.city LIKE ?';
      params.push(`%${req.query.city}%`);
    }
    
    // Filtre par prix minimum
    if (req.query.minPrice) {
      query += ' AND r.price_per_hour >= ?';
      params.push(req.query.minPrice);
    }
    
    // Filtre par prix maximum  
    if (req.query.maxPrice) {
      query += ' AND r.price_per_hour <= ?';
      params.push(req.query.maxPrice);
    }
    
    // Filtre par capacité
    if (req.query.minCapacity) {
      query += ' AND r.capacity >= ?';
      params.push(req.query.minCapacity);
    }
    
    query += ' ORDER BY r.created_at DESC';
    
    console.log('🔍 Final Query:', query);
    console.log('🔍 Query Params:', params);
    
    const [rows] = await pool.execute(query, params);
    
    
    const formattedRooms = rows.map(room => ({
      ...room,
      image: room.main_image ? {
        id: room.image_id,
        image_url: room.main_image,
        is_main: 1
      } : null
    }));
    
    res.json({
      success: true,
      message: `${formattedRooms.length} salles trouvées`,
      data: {
        rooms: formattedRooms,
        total: formattedRooms.length
      }
    });
    
  } catch (error) {
    console.error('Erreur getAllRooms:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// GET /api/rooms/:id - CORRIGÉE
exports.getRoomById = async (req, res) => {
  console.log(`📥 GET /api/rooms/${req.params.id}`);
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM rooms WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    // Récupérer les images de la salle
    const [images] = await pool.execute(
      'SELECT * FROM room_images WHERE room_id = ?',
      [req.params.id]
    );
    
    // Récupérer les avis
    const [reviews] = await pool.execute(
      `SELECT r.*, u.first_name, u.last_name 
       FROM reviews r
       LEFT JOIN users u ON r.client_id = u.id
       WHERE r.room_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    
    // Calculer la note moyenne
    const [avgRating] = await pool.execute(
      'SELECT AVG(rating) as average_rating FROM reviews WHERE room_id = ?',
      [req.params.id]
    );
    
    const room = rows[0];
    
    // Convertir amenities de JSON si nécessaire
    let amenities = [];
    try {
      amenities = room.amenities ? JSON.parse(room.amenities) : [];
    } catch (e) {
      amenities = [];
    }
    
    // Récupérer les informations du propriétaire
    const [ownerInfo] = await pool.execute(
      'SELECT first_name, last_name, email FROM users WHERE id = ?',
      [room.owner_id]
    );
    
    res.json({
      success: true,
      data: {
        room: {
          ...room,
          amenities,
          images,
          reviews,
          average_rating: avgRating[0]?.average_rating || 0,
          owner_info: ownerInfo[0] || null
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur dans getRoomById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la salle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== FONCTIONS PROTÉGÉES =====

// POST /api/rooms
// POST /api/rooms - AJOUTER LA GESTION DES IMAGES
exports.createRoom = async (req, res) => {
  console.log('📥 POST /api/rooms');
  console.log('Utilisateur:', req.user);
  console.log('Fichier reçu:', req.file);
  
  try {
    // Vérification basique de l'utilisateur
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }
    
    // Vérifier le rôle - SEULEMENT propriétaire ou admin peut créer
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Seuls les propriétaires et administrateurs peuvent créer des salles.'
      });
    }
    
    const {
      title, description, capacity, price_per_hour,
      address, city, postal_code, country,
      latitude, longitude, amenities
    } = req.body;
    
    // Validation simple
    if (!title || !capacity || !price_per_hour || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants: titre, capacité, prix, adresse, ville'
      });
    }
    
    // 1. Créer la salle dans la base
    const [result] = await pool.execute(
      `INSERT INTO rooms (
        owner_id, title, description, capacity, price_per_hour,
        address, city, postal_code, country, latitude, longitude, amenities, is_available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        req.user.id,
        title,
        description || '',
        parseInt(capacity),
        parseFloat(price_per_hour),
        address,
        city,
        postal_code || '',
        country || 'algerie',
        latitude || null,
        longitude || null,
        amenities ? JSON.stringify(amenities) : '[]'
      ]
    );
    
    const roomId = result.insertId;
    console.log(`✅ Salle créée - ID: ${roomId}`);
    
    // 2. Si une image a été uploadée, l'enregistrer
    if (req.file) {
      console.log('📸 Image uploadée:', req.file.filename);
      
      await pool.execute(
        'INSERT INTO room_images (room_id, image_url, is_main) VALUES (?, ?, 1)',
        [roomId, req.file.filename]
      );
      
      console.log('✅ Image enregistrée dans la base');
    }
    
    // 3. Récupérer la salle créée avec l'image
    const [newRoom] = await pool.execute(
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    );
    
    // 4. Récupérer l'image si elle existe
    const [images] = await pool.execute(
      'SELECT * FROM room_images WHERE room_id = ?',
      [roomId]
    );
    
    const roomWithImage = {
      ...newRoom[0],
      image: images.length > 0 ? images[0] : null
    };
    
    res.status(201).json({
      success: true,
      message: req.file ? 'Salle créée avec image avec succès' : 'Salle créée avec succès',
      data: {
        room: roomWithImage
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur dans createRoom:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// PUT /api/rooms/:id
exports.updateRoom = async (req, res) => {
  console.log(`📥 PUT /api/rooms/${req.params.id}`);
  
  try {
    // Vérifier si l'utilisateur est propriétaire de la salle
    const [roomRows] = await pool.execute(
      'SELECT owner_id FROM rooms WHERE id = ?',
      [req.params.id]
    );
    
    if (roomRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    const room = roomRows[0];
    
    // Autoriser seulement le propriétaire ou un admin
    if (room.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Vous n\'êtes pas le propriétaire.'
      });
    }
    
    // Mise à jour des champs fournis
    const updateFields = [];
    const updateValues = [];
    
    if (req.body.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(req.body.title);
    }
    if (req.body.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(req.body.description);
    }
    if (req.body.capacity !== undefined) {
      updateFields.push('capacity = ?');
      updateValues.push(parseInt(req.body.capacity));
    }
    if (req.body.price_per_hour !== undefined) {
      updateFields.push('price_per_hour = ?');
      updateValues.push(parseFloat(req.body.price_per_hour));
    }
    if (req.body.address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(req.body.address);
    }
    if (req.body.city !== undefined) {
      updateFields.push('city = ?');
      updateValues.push(req.body.city);
    }
    if (req.body.postal_code !== undefined) {
      updateFields.push('postal_code = ?');
      updateValues.push(req.body.postal_code);
    }
    if (req.body.country !== undefined) {
      updateFields.push('country = ?');
      updateValues.push(req.body.country);
    }
    if (req.body.is_available !== undefined) {
      updateFields.push('is_available = ?');
      updateValues.push(req.body.is_available ? 1 : 0);
    }
    if (req.body.amenities !== undefined) {
      updateFields.push('amenities = ?');
      updateValues.push(JSON.stringify(req.body.amenities));
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }
    
    // Ajouter la date de mise à jour
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Ajouter l'ID de la salle
    updateValues.push(req.params.id);
    
    const query = `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = ?`;
    
    const [result] = await pool.execute(query, updateValues);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    // Récupérer la salle mise à jour
    const [updatedRoom] = await pool.execute(
      'SELECT * FROM rooms WHERE id = ?',
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: 'Salle mise à jour avec succès',
      data: { room: updatedRoom[0] }
    });
    
  } catch (error) {
    console.error('❌ Erreur dans updateRoom:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// DELETE /api/rooms/:id - CORRIGÉE
exports.deleteRoom = async (req, res) => {
  console.log(`📥 DELETE /api/rooms/${req.params.id}`);
  
  try {
    // Vérifier si l'utilisateur est propriétaire de la salle
    const [roomRows] = await pool.execute(
      'SELECT owner_id FROM rooms WHERE id = ?',
      [req.params.id]
    );
    
    if (roomRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    const room = roomRows[0];
    
    // Autoriser seulement le propriétaire ou un admin
    if (room.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Vous n\'êtes pas le propriétaire.'
      });
    }
    
    // Supprimer les images associées
    await pool.execute('DELETE FROM room_images WHERE room_id = ?', [req.params.id]);
    
    // Supprimer la salle
    const [result] = await pool.execute(
      'DELETE FROM rooms WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Salle non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Salle supprimée avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur dans deleteRoom:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression'
    });
  }
};

// ===== ROUTES PROPRIÉTAIRE =====

// GET /api/rooms/owner/my-rooms
exports.getOwnerRooms = async (req, res) => {
  console.log('📥 GET /api/rooms/owner/my-rooms');
  
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM rooms WHERE owner_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    
    res.json({
      success: true,
      message: `${rows.length} salles trouvées`,
      data: { rooms: rows }
    });
    
  } catch (error) {
    console.error('❌ Erreur dans getOwnerRooms:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// GET /api/rooms/owner/stats
exports.getOwnerStats = async (req, res) => {
  console.log('📥 GET /api/rooms/owner/stats');
  
  try {
    // Statistiques basiques
    const [roomStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_rooms,
        SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available_rooms,
        AVG(price_per_hour) as avg_price
       FROM rooms 
       WHERE owner_id = ?`,
      [req.user.id]
    );
    
    // Statistiques de réservations
    const [bookingStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(total_price) as total_revenue,
        AVG(total_price) as avg_booking_value
       FROM bookings b
       INNER JOIN rooms r ON b.room_id = r.id
       WHERE r.owner_id = ? AND b.status = 'confirmed'`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: {
        stats: {
          ...roomStats[0],
          ...bookingStats[0]
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur dans getOwnerStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ===== ROUTES ADMIN =====

// GET /api/rooms/admin/all - Pour l'admin
exports.getAllRoomsAdmin = async (req, res) => {
  console.log('📥 GET /api/rooms/admin/all (Admin)');
  
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.first_name as owner_first_name, u.last_name as owner_last_name 
       FROM rooms r
       LEFT JOIN users u ON r.owner_id = u.id
       ORDER BY r.created_at DESC`
    );
    
    res.json({
      success: true,
      data: { rooms: rows }
    });
    
  } catch (error) {
    console.error('❌ Erreur liste salles admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};