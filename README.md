# RESERVATION-DE-SALLE

## Présentation du projet
**Reservation-de-salle** est une application web complète permettant la location et réservation de salles de réunion ou d’événements, entre propriétaires et clients.

### Technologies utilisées
- **Backend** : Node.js, Express.js, MySQL2, JWT, Bcryptjs, Multer, Express-validator, Cors  
- **Frontend** : React 18, React Router 6, Axios, Context API, Leaflet, CSS Modules  
- **Outils de développement** : Nodemon, Postman/Insomnia, Git, VS Code

---

## Auteurs
- Chebri Koceila  
- Mecellem Massinissa  
- Harket Soraya  
- Saidani Rabah  

---

## Structure du projet

reservation-de-salle/
├── backend/
│ ├── src/
│ │ ├── config/ # Configuration (database.js)
│ │ ├── controllers/ # Logique métier
│ │ ├── middleware/ # Middleware (auth, upload, validation)
│ │ ├── models/ # Modèles de données
│ │ ├── routes/ # Routes API
│ │ ├── utils/ # Utilitaires
│ │ └── server.js # Point d'entrée
│ ├── uploads/ # Fichiers uploadés
│ ├── .env # Variables d'environnement
│ ├── package.json
│ └── package-lock.json
│
├── frontend/
│ ├── public/ # Fichiers statiques
│ ├── src/
│ │ ├── components/ # Composants réutilisables
│ │ ├── pages/ # Pages de l'application
│ │ ├── services/ # Services API
│ │ ├── context/ # Contexte React
│ │ ├── App.js # Composant principal
│ │ ├── App.css # Styles globaux
│ │ └── index.js # Point d'entrée React
│ ├── .env # Configuration frontend
│ ├── package.json
│ └── README.md
└── README.md

---
## Base de données MySQL

**Nom** : `reservation_salles`  

### Tables principales
- `users` : utilisateurs  
- `rooms` : salles  
- `bookings` : réservations  
- `reviews` : avis  
- `room_images` : images des salles  



### SCHEMA DE LA BASE DE DONNÉES:
```sql

-- Users
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('visitor', 'client', 'owner', 'admin') DEFAULT 'client',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 )


-- Rooms
CREATE TABLE rooms (
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
);

--bookings
CREATE TABLE bookings (
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

---reviews
CREATE TABLE reviews (
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

---room_images
CREATE TABLE room_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_main TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```
# Installation et Configuration

Prérequis
- Node.js (v14+)
- MySQL (8.0+)

Backend

```bash
cd backend
npm install       # Installer les dépendances
cp .env           # Copier fichier de configuration
```
 Configuration .env backend :
```bash
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=23112000
DB_NAME=reservation_salles
JWT_SECRET=ma_super_secret_key_pour_jwt_2025_reservation
NODE_ENV=development
JWT_EXPIRE=30d
UPLOADS_PATH=./uploads
```
---
Frontend
```bash
cd frontend
npm install
cp .env
```
 Configuration .env frontend :
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

---
# Lancer le projet 

## Base donnees:
-- Se connecter à MySQL:
```sql
mysql -u root -p
```
---
-- Créer la base de données:
```sql
CREATE DATABASE reservation_salles;
```
---
-- Utiliser la base de données :
```sql
USE reservation_salles;
```
---
## Backend :
```bash
cd backend
npm run dev
```

Serveur sur http://localhost:5000
---
## Frontend :
```bash
cd frontend
npm start
```
L’application sera accessible sur http://localhost:3000

---

Endpoints API principaux

Authentification
Méthode	Endpoint	Description
POST	/api/auth/register	Inscription
POST	/api/auth/login	Connexion
GET	/api/auth/profile	Profil utilisateur

Salles
Méthode	Endpoint	Description
GET	/api/rooms	Liste des salles
POST	/api/rooms	Créer une salle (propriétaire)
PUT	/api/rooms/:id	Modifier salle
DELETE	/api/rooms/:id	Supprimer salle

Réservations
Méthode	Endpoint	Description
POST	/api/bookings	Créer une réservation
PUT	/api/bookings/:id/cancel	Annuler réservation

Avis
Méthode	Endpoint	Description
POST	/api/reviews	Créer un avis
GET	/api/reviews/room/:roomId	Avis d’une salle




# RÔLES ET PERMISSIONS :

Visiteur
Consulter les salles disponibles
Voir les détails des salles
Voir les avis

Client
Toutes les permissions visiteur
Réserver des salles
Gérer ses réservations
Laisser des avis après réservation terminée

Propriétaire
Toutes les permissions client
Créer/modifier/supprimer ses salles
Upload d'images pour ses salles
Gérer les réservations de ses salles (accepter/refuser)
Voir les statistiques de ses salles

Administrateur
Toutes les permissions
Gérer tous les utilisateurs
Modifier/supprimer n'importe quelle salle et reservation
Accès aux statistiques globales





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

Disponibles pour Propriétaires
>Nombre total de salles
>Salles disponibles
>Nombre de réservations
>Prix moyen par heure
>Nombre d'avis
>Note moyenne

Disponibles pour Administrateurs
>Nombre total d'utilisateurs
>Répartition par rôle
>Nombre total de salles
>Taux d'occupation global

