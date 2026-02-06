const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const User = require('../models/user.model');

exports.register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role = 'client' } = req.body;

    // Validation des rôles autorisés
    const validRoles = ['client', 'owner', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Choisissez entre: client, owner, admin'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // créer l'utilisateur avec le rôle spécifié
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      role: role
    });

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier l'utilisateur
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    
    // Mettre à jour dans la base
    const [result] = await pool.execute(
      'UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
      [first_name, last_name, email, req.user.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });
    
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ------------- FONCTIONS ADMIN -----------------




// Obtenir l'utilisateurs admin 
exports.getAllUsers = async (req, res) => {
  try {
    console.log('GET /api/auth/admin/users - User role:', req.user?.role);
    
    // Vérifier que l'utilisateur est admin
    if (!req.user || req.user.role !== 'admin') {
      console.log(' Accès refusé: utilisateur pas admin');
      return res.status(403).json({
        success: false,
        message: 'Accès interdit. Admin seulement.'
      });
    }

    const [rows] = await pool.execute(
      `SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        role, 
        DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as created_at
       FROM users 
       ORDER BY created_at DESC`
    );
    
    console.log(` ${rows.length} utilisateurs trouvés`);
    
    res.json({
      success: true,
      data: {
        users: rows,
        total: rows.length
      }
    });
    
  } catch (error) {
    console.error(' Erreur liste utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
};




exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    console.log(` Mise à jour rôle user ${userId} -> ${role}`);
    
    // Valider le rôle
    const validRoles = ['client', 'owner', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Rôle invalide. Choisissez entre: ${validRoles.join(', ')}`
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    console.log(` Rôle mis à jour pour user ${userId}`);
    
    res.json({
      success: true,
      message: 'Rôle mis à jour avec succès'
    });
    
  } catch (error) {
    console.error(' Erreur mise à jour rôle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
};




// Créer l'admin 
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    
    console.log(` Création admin: ${email}`);
    
    // hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Vérifier si l'email existe déjà
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, first_name, last_name, 'admin']
    );
    
    console.log(` Admin créé avec ID: ${result.insertId}`);
    
    res.status(201).json({
      success: true,
      message: 'Administrateur créé avec succès',
      data: {
        id: result.insertId,
        email,
        first_name,
        last_name,
        role: 'admin'
      }
    });
    
  } catch (error) {
    console.error(' Erreur création admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur: ' + error.message
    });
  }
};

// Supprimer un utilisateur 

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // l'admin ne se supprime pas lui même
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }
    
    // Démarrer une transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Supprimer les avis de l'utilisateur
      await connection.execute('DELETE FROM reviews WHERE client_id = ?', [userId]);
      
      // Supprimer les réservations de l'utilisateur
      await connection.execute('DELETE FROM bookings WHERE client_id = ?', [userId]);
      
      // Si c'est un propriétaire, supprimer ses salles et leurs images
      const [rooms] = await connection.execute('SELECT id FROM rooms WHERE owner_id = ?', [userId]);
      
      for (const room of rooms) {
        await connection.execute('DELETE FROM room_images WHERE room_id = ?', [room.id]);
        await connection.execute('DELETE FROM reviews WHERE room_id = ?', [room.id]);
        await connection.execute('DELETE FROM bookings WHERE room_id = ?', [room.id]);
      }
      
      await connection.execute('DELETE FROM rooms WHERE owner_id = ?', [userId]);
      
      // Supprimer l'utilisateur
      const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      await connection.commit();
      connection.release();
      
      res.json({
        success: true,
        message: 'Utilisateur supprimé avec succès'
      });
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression'
    });
  }
};