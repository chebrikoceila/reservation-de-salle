const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  // Trouver par email
  findByEmail: async (email) => {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  // Trouver par ID
  findById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Créer un utilisateur
  create: async (userData) => {
    const { email, password, first_name, last_name, role = 'client' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, first_name, last_name, role]
    );
    
    return { 
      id: result.insertId, 
      email, 
      first_name, 
      last_name, 
      role,
      created_at: new Date()
    };
  },

  // Comparer mot de passe
  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  
  updateRole: async (userId, newRole) => {
    const [result] = await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [newRole, userId]
    );
    return result.affectedRows > 0;
  },

  // Obtenir tous les utilisateurs (admin)
  findAll: async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    const [rows] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, created_at FROM users LIMIT ? OFFSET ?',
      [limit, offset]
    );
    
    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM users');
    
    return {
      users: rows,
      total: countRows[0].total,
      page,
      limit
    };
  }
};

module.exports = User;