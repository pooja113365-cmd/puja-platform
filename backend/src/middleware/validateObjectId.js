const ApiError = require('../utils/ApiError');
const { isObjectId } = require('../utils/helpers');

// Rejects malformed ObjectIds with a 400 before they can cause Mongoose CastErrors.
const validateId = (...params) => (req, _res, next) => {
  const name = params[0] ? params : ['id'];
  for (const p of name) {
    if (!isObjectId(req.params[p])) return next(ApiError.badRequest(`Invalid ${p}`));
  }
  return next();
};

module.exports = validateId;

