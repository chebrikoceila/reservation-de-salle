const moment = require('moment');

// Formater les dates
exports.formatDate = (date, format = 'DD/MM/YYYY HH:mm') => {
  return moment(date).format(format);
};

// Calculer la durée entre deux dates
exports.calculateDuration = (startDate, endDate) => {
  const start = moment(startDate);
  const end = moment(endDate);
  const duration = moment.duration(end.diff(start));
  
  return {
    hours: duration.asHours(),
    days: duration.asDays(),
    formatted: `${Math.floor(duration.asHours())}h ${duration.minutes()}m`
  };
};

// Valider l'email
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Générer une chaîne aléatoire
exports.generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Pagination helper
exports.getPaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

// Extraire les filtres de requête
exports.extractFilters = (req, allowedFilters) => {
  const filters = {};
  allowedFilters.forEach(filter => {
    if (req.query[filter] !== undefined) {
      filters[filter] = req.query[filter];
    }
  });
  return filters;
};