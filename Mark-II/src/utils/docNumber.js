// v0.0.3
const config = require('../config');

function formatDocNumber(date = new Date(), sequence = 1) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  return `${config.docPrefix}-${yyyy}${mm}${dd}-${seq}`;
}

module.exports = {
  formatDocNumber
};

