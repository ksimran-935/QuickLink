const { validationResult } = require("express-validator");

// Reads errors collected by express-validator chains and returns 400 if any exist
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

module.exports = validate;
