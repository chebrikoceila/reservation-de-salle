const { body, param, query, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Validation pour l'inscription
const validateRegister = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit faire au moins 6 caractères'),
  body('first_name')
    .notEmpty().withMessage('Le prénom est requis'),
  body('last_name')
    .notEmpty().withMessage('Le nom est requis'),
  validateRequest
];

// Validation pour la connexion
const validateLogin = [
  body('email')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis'),
  validateRequest
];

// Validation pour la création de salle
const validateRoom = [
  body('title')
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ max: 255 }).withMessage('Le titre est trop long'),
  body('description')
    .optional(),
  body('capacity')
    .isInt({ min: 1 }).withMessage('La capacité doit être au moins 1'),
  body('price_per_hour')
    .isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
  body('address')
    .notEmpty().withMessage('L\'adresse est requise'),
  body('city')
    .notEmpty().withMessage('La ville est requise'),
  body('postal_code')
    .notEmpty().withMessage('Le code postal est requis'),
  body('country')
    .notEmpty().withMessage('Le pays est requis'),
  validateRequest
];

// Validation pour la réservation
const validateBooking = [
  body('room_id')
    .isInt().withMessage('ID de salle invalide'),
  body('start_datetime')
    .isISO8601().withMessage('Date de début invalide'),
  body('end_datetime')
    .isISO8601().withMessage('Date de fin invalide')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_datetime)) {
        throw new Error('La date de fin doit être après la date de début');
      }
      return true;
    }),
  validateRequest
];

// Validation pour les avis
const validateReview = [
  body('booking_id')
    .isInt().withMessage('ID de réservation invalide'),
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 }).withMessage('Le commentaire est trop long'),
  validateRequest
];

module.exports = {
  validateRegister,
  validateLogin,
  validateRoom,
  validateBooking,
  validateReview
};