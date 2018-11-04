const path = require('path');
const fs = require('fs');

function getUserConfig(filePath) {
  const config = require(require.resolve(path.join(process.cwd(), filePath)));
  return config;
}

module.exports = {
  getUserConfig,
};
