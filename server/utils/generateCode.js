const { nanoid } = require("nanoid");

// Generates a URL-safe random string of given length
// nanoid uses a 64-character alphabet — collision probability is negligible at this scale
const generateCode = (length = 7) => nanoid(length);

module.exports = generateCode;
