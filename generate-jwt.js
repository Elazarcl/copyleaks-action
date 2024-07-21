const jwt = require('jsonwebtoken');
const fs = require('fs');

const appId = '944685'; // Replace with your GitHub App ID
const privateKey = fs.readFileSync('./elazarclapp.2024-07-14.private-key.pem', 'utf8');

const payload = {
  iat: Math.floor(Date.now() / 1000), // Issued at time
  exp: Math.floor(Date.now() / 1000) + (10 * 60), // JWT expiration time (10 minutes maximum)
  iss: appId // GitHub App's identifier
};

const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
console.log(token);