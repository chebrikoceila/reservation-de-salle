 # PRÉSENTATION DU PROJET:

Nom du Projet : RESERVATION-DE-SALLE
Description : Application web complète permettant la location et réservation de salles de réunion/événements entre propriétaires et clients.
Technologies : (MySQL, Express, React, Node.js)


# Auteurs :
 Chebri koceila
 mecellem massinissa
 harket soraya
 saidani rabah


# STRUCTURE DU PROJET :


# reservation-de-salle

# backend/
├── src/
│   ├── config/                                          # Configuration
│   │   └── database.js                                  # Connexion MySQL
│   ├── controllers/                                     # Logique métier
│   │   ├── auth.controller.js
│   │   ├── booking.controller.js
│   │   ├── review.controller.js
│   │   └── room.controller.js
│   ├── middleware/                                      # Middleware
│   │   ├── auth.js                                      # Authentification JWT
│   │   ├── upload.js                                    # Upload fichiers
│   │   └── validation.js                                # Validation données
│   ├── models/                                          # Modèles de données
│   │   ├── user.model.js
│   │   ├── booking.model.js
│   │   ├── review.model.js
│   │   └── room.model.js
│   ├── routes/                                          # Routes API
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── review.routes.js
│   │   └── room.routes.js
│   ├── utils/                                           # Utilitaires
│   │   └── helpers.js
│   └── server.js                                        # Point d'entrée
├── uploads/                                             # Fichiers uploadés
│   └── rooms/
├── .env                                                 # Variables d'environnement
├── .gitignore
├── package.json
└── package-lock.json

# Frontend/
├── public/                                              # Fichiers statiques
│   └──  index.html
│   
├── src/
│   ├── components/                                      # Composants réutilisables
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   ├── RoomCard.js
│   │   ├── ProtectedRoute.js
│   │   ├── MapComponent.js                              # Carte de localisation
│   │   └── LocationPicker.js                            # Sélecteur d'emplacement
│   ├── pages/                                           # Pages de l'application
│   │   ├── Home.js                                      # Page d'accueil
│   │   ├── Login.js                                     # Connexion
│   │   ├── Register.js                                  # Inscription
│   │   ├── RoomList.js                                  # Liste des salles 
│   │   ├── CreateReview.js                              # cree un avis
│   │   ├── RoomDetail.js                                # Détail d'une salle
│   │   ├── Booking.js                                   # Réservation
│   │   ├── Dashboard.js                                 # Tableau de bord client
│   │   ├── OwnerDashboard.js                            # Espace propriétaire
│   │   ├── AdminDashboard.js                            # Administration
│   │   └── CreateReview.js                              # Formulaire d'avis
│   ├── services/                                        # Services API
│   │   ├── api.js                                       # Configuration axios
│   │   └── auth.js                                      # Service authentification
│   ├── context/                                         # Context React
│   │   └── AuthContext.js                               # Contexte d'authentification
│   ├── App.js                                           # Composant principal
│   ├── App.css                                          # Styles globaux
│   └── index.js                                         # Point d'entrée React
├── .env                                                 # Configuration
├── .gitignore
├── package.json
└── README.md



# Base de Données MySQL:

# Nom : reservation_salles

# Tables 
├── users               # Utilisateurs
├── rooms               # Salles
├── bookings            # Réservations
├── reviews             # Avis
└── room_images         # Images des salles



# SCHEMA DE LA BASE DE DONNÉES:

# TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('visitor', 'client', 'owner', 'admin') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 )


# TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INT NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    amenities JSON,
    is_available TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
)

# TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    client_id INT NOT NULL,
    room_id INT NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

# TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT UNIQUE NOT NULL,
    client_id INT NOT NULL,
    room_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

# TABLE room_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_main TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);



# INSTALLATION ET CONFIGURATION

-Node.js (v14+)
-MySQL (8.0+)

# Installation Backend
1. Installer les dépendances
npm install

2. Configurer l'environnement
cp .env.example .env

3. Éditer .env avec les configurations
Configuration .env backend 
(
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ton_mot_de_passe
DB_NAME=reservation_salles
JWT_SECRET=ta_clé_secrète_jwt
JWT_EXPIRE=30d
NODE_ENV=development
UPLOADS_PATH=./uploads
)

2. Installation Frontend

npm install

# Configurer
cp .env.example .env
Configuration .env frontend :
(
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
)

# Initialisation Base de Données

1. Se connecter à MySQL
mysql -u root -p

2. Créer la base de données
CREATE DATABASE reservation_salles;
USE reservation_salles;

3. Terminal 1 - Backend
npm run dev
Serveur sur http://localhost:5000

4. Terminal 2 - Frontend
npm start
 Application sur http://localhost:3000




# API ENDPOINTS

# Authentification
POST   /api/auth/register      # Inscription
POST   /api/auth/login         # Connexion
GET    /api/auth/profile       # Profil utilisateur
GET    /api/auth/users         # Liste utilisateurs (admin)
PUT    /api/auth/users/:id/role # Modifier rôle (admin)

# Salles
GET    /api/rooms              # Liste toutes les salles
GET    /api/rooms/:id          # Détail d'une salle
POST   /api/rooms              # Créer une salle (propriétaire)
PUT    /api/rooms/:id          # Modifier une salle (propriétaire)
DELETE /api/rooms/:id          # Supprimer une salle (propriétaire)
GET    /api/rooms/owner/my-rooms # Mes salles (propriétaire)
GET    /api/rooms/owner/stats  # Statistiques propriétaire

# Réservations
POST   /api/bookings           # Créer une réservation (client)
GET    /api/bookings/my-bookings # Mes réservations (client)
PUT    /api/bookings/:id/cancel # Annuler réservation (client)
GET    /api/bookings/owner/bookings # Réservations pour mes salles (propriétaire)
PUT    /api/bookings/:id/confirm # Confirmer réservation (propriétaire)
PUT    /api/bookings/:id/reject  # Refuser réservation (propriétaire)

# Avis
POST   /api/reviews            # Créer un avis (client)
GET    /api/reviews/room/:roomId # Avis d'une salle
GET    /api/reviews/my-reviews  # Mes avis (client)




# RÔLES ET PERMISSIONS :

# Visiteur
-Consulter les salles disponibles
-Voir les détails des salles
-Voir les avis

# Client
-Toutes les permissions visiteur
-Réserver des salles
-Gérer ses réservations
-Laisser des avis après réservation terminée

# Propriétaire
-Toutes les permissions client
-Créer/modifier/supprimer ses salles
-Upload d'images pour ses salles
-Gérer les réservations de ses salles (accepter/refuser)
-Voir les statistiques de ses salles

# Administrateur
-Toutes les permissions
-Gérer tous les utilisateurs
-Modifier/supprimer n'importe quelle salle et reservation
-Accès aux statistiques globales





# FONCTIONNALITÉS AVANCÉES

1. Système de Localisation :

-Carte interactive (Leaflet/OpenStreetMap)
-Géocodage automatique des villes
-Sélection précise des coordonnées GPS
-Affichage des salles sur carte

2. Gestion des Images :

-Upload multiple d'images
-Validation du type et taille
-Stockage local dans /uploads
-Image principale désignable

3. Système d'Avis :

-Notation de 1 à 5 étoiles
-Commentaires modérés
-Validation : réservation terminée seulement
-Affichage public avec moyenne

4. Recherche et Filtrage :

-Par ville, capacité, prix
-Disponibilité en temps réel
-Tri par prix, capacité, notation
-Pagination des résultats

5. Gestion des Réservations :

-Vérification des conflits de dates
-Calcul automatique du prix
-Statuts : en attente, confirmé, terminé, annulé
-Notifications 



# TECHNOLOGIES UTILISÉES :

# Backend :
-Node.js : Environnement d'exécution
-Express.js : Framework web
-MySQL2 : Driver MySQL
-JWT : Authentification
-Bcryptjs : Hash des mots de passe
-Multer : Upload de fichiers
-Express-validator : Validation
-Cors : Partage de ressources cross-origin

# Frontend :
-React 18 : Bibliothèque UI
-React Router 6 : Navigation
-Axios : Requêtes HTTP
-Context API : Gestion d'état
-Leaflet : Cartes interactives
-CSS Modules : Styles

# Outils de Développement :
-Nodemon : Redémarrage automatique
-Postman/Insomnia : Test API
-Git : Versionnement
-VS Code : Éditeur

# SÉCURITÉ :

-Authentification JWT avec expiration
-Hash Bcrypt pour les mots de passe
-Validation des entrées utilisateur
-Protection CORS configurée
-Middleware d'authentification sur routes sensibles
-Sanitization des données
-Permissions par rôle
-Variables d'environnement pour les secrets
-Logs d'erreurs sans informations sensibles
-Validation côté serveur et client
-Gestion des erreurs centralisée
-Timeout sur les requêtes


# INTERFACES UTILISATEUR :

# Page d'Accueil
>Présentation de la plateforme
>Salles populaires en vedette
>Appels à l'action
>Fonctionnalités principales

# Liste des Salles
>Grille responsive
>Filtres avancés
>Pagination
>Cartes avec informations essentielles

# Détail d'une Salle
>Galerie d'images
>Description complète
>Équipements
>Carte de localisation
>Formulaire de réservation
>Avis des clients

# Tableau de Bord Client
>Réservations en cours
>Historique
>Avis laissés
>Actions rapides

# Espace Propriétaire
>Gestion des salles
>Réservations en attente
>Statistiques
>Formulaire de création

# Administration
>Gestion utilisateurs
>Supervision des salles
>Modération des avis
>Statistiques globales


Configuration Production
env
# Backend 
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=23112000
DB_NAME=reservation_salles
JWT_SECRET=ma_super_secret_key_pour_jwt_koceila_2025
JWT_EXPIRE=30d
ALLOWED_ORIGINS=https://localhost:3000,http://localhost:5173
Port du serveur:PORT=5000

# TEST :
Tests Manuels
>Inscription/Connexion avec différents rôles
>Création de salle avec images et localisation
>Recherche avec filtres
>Réservation avec dates valides
>Gestion des réservations (confirmer/refuser)
>Système d'avis après réservation terminée
>Permissions par rôle



# STATISTIQUES ET MÉTRIQUES :

# Disponibles pour Propriétaires
>Nombre total de salles
>Salles disponibles
>Nombre de réservations
>Prix moyen par heure
>Nombre d'avis
>Note moyenne

# Disponibles pour Administrateurs
>Nombre total d'utilisateurs
>Répartition par rôle
>Nombre total de salles
>Taux d'occupation global

