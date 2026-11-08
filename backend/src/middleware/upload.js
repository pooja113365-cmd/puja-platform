const multer = require('multer');
const ApiError = require('../utils/ApiError');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.includes(file.mimetype)
      ? cb(null, true)
      : cb(ApiError.badRequest('Only JPG, PNG, WEBP images or PDF files are allowed')),
});

module.exports = upload;

