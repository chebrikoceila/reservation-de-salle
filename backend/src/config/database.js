const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reservation_salles',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Fonction pour tester la connexion
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(' Connexion à MySQL établie avec succès !');
    
    // Vérifier si la base existe
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [process.env.DB_NAME]);
    if (databases.length === 0) {
      console.warn(`La base '${process.env.DB_NAME}' n'existe pas`);
    } else {
      console.log(`Base '${process.env.DB_NAME}' trouvée`);
    }
    
    connection.release();
  } catch (error) {
    console.error(' Erreur de connexion MySQL:', error.message);
    console.log(' Vérifie:');
    console.log(` - Host: ${process.env.DB_HOST}`);
    console.log(` - User: ${process.env.DB_USER}`);
    console.log(` - Mot de passe: ${process.env.DB_PASSWORD ? '***' : '(vide)'}`);
    console.log(` - Base: ${process.env.DB_NAME}`);
  }
}


testConnection();

module.exports = pool;