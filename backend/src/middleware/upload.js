const multer = require('multer');
const path = require('path');
const fs = require('fs');


const createUploadDirs = () => {
  const dirs = [
    './uploads',
    './uploads/avatars',
    './uploads/rooms'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();


const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/avatars');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});


const roomStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/rooms');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
  }
});


const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
  }
};


const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};


exports.uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits
}).single('avatar');


exports.uploadRoomImage = multer({
  storage: roomStorage,
  fileFilter,
  limits
}).single('image');  


exports.uploadRoomImages = multer({
  storage: roomStorage,
  fileFilter,
  limits
}).array('images', 10);