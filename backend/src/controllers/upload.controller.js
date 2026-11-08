const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

exports.uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded (field name: file)');
  const subFolder = req.body?.folder === 'kyc' ? 'kyc' : 'images';

  if (isCloudinaryConfigured()) {
    const folder = `puja-platform/${subFolder}`;
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (err, r) => (err ? reject(err) : resolve(r))
      );
      stream.end(req.file.buffer);
    }).catch((e) => {
      console.error('Cloudinary upload failed', e?.message);
      throw new ApiError(502, 'Upload failed. Please try again.');
    });
    return res.status(201).json({
      success: true,
      data: { url: result.secure_url, publicId: result.public_id, storage: 'cloudinary' },
    });
  }

  // Local disk storage fallback when Cloudinary credentials are not set in .env
  const targetDir = path.join(UPLOADS_ROOT, subFolder);
  await fs.promises.mkdir(targetDir, { recursive: true });
  const ext = EXT_BY_MIME[req.file.mimetype] || path.extname(req.file.originalname || '') || '.bin';
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const fullPath = path.join(targetDir, fileName);
  await fs.promises.writeFile(fullPath, req.file.buffer);

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/${subFolder}/${fileName}`;
  return res.status(201).json({
    success: true,
    data: { url, publicId: `local/${subFolder}/${fileName}`, storage: 'local' },
  });
});
