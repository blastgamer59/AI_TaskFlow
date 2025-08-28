function generateId(prefix = '') {
  const randomStr = Math.random().toString(36).substring(2, 10);
  const timeStr = Date.now().toString(36);
  return `${prefix}${timeStr}${randomStr}`;
}

module.exports = generateId;