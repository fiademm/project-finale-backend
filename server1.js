const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const SendBird = require('sendbird');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const sendbirdAppId = '5BF6CBAF-9A3F-4EDE-B332-FFDD2232D488'; // Replace with your actual Sendbird App ID

// Endpoint for user authentication (using JWT)
app.post('/api/auth', (req, res) => {
  // Replace this with your actual user authentication logic
  const { username, password } = req.body;
  const user = { id: 123, username }; // Replace '123' with the user's ID from your database

  // Generate a JWT token and send it back to the frontend
  const token = jwt.sign(user, '1087C7B5162307CE7C5AE4B2C5D207166D424842C0571E00FFCEDED5C065EBFA'); // Replace 'your_secret_key' with your JWT secret key
  res.json({ token });
});

// Endpoint to get the Sendbird App ID
app.get('/api/sendbird/appId', (req, res) => {
  res.json({ appId: sendbirdAppId });
});

// Middleware to authenticate Sendbird requests using JWT
const authenticateSendBird = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, '1087C7B5162307CE7C5AE4B2C5D207166D424842C0571E00FFCEDED5C065EBFA', (err, user) => {
      if (err) {
        res.sendStatus(403);
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    res.sendStatus(401);
  }
};

// Endpoint to handle Sendbird user authentication
app.post('/api/sendbird/authenticate', authenticateSendBird, (req, res) => {
  const sb = SendBird({ appId: sendbirdAppId });
  const { userId } = req.user;

  sb.connect(userId, (user, error) => {
    if (error) {
      console.error('Sendbird connection error:', error);
      res.sendStatus(500);
    } else {
      res.json({ userId });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});