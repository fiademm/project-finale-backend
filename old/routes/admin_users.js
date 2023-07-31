const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');

const router = express.Router();

// user signup
router.post('/signup', async (req, res) => {
    try {
        const { name, emailAddress, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO admin (name, emailAddress, password) VALUES ($1, $2, $3) RETURNING id', [name, emailAddress, hashedPassword]);
        const userId = result.rows[0].id;
        const token = jwt.sign({ userId }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error');
    }
});

// login route
router.post('/login', async (req, res) => {
  try {
    const { emailAddress, password } = req.body;
    const user = await pool.query('SELECT * FROM admin WHERE emailAddress = $1', [emailAddress]);

    if (user.rows.length === 0) {
      return res.status(401).send('Invalid email or password');
    }

    // compare the provided password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if(!validPassword) {
      return res.status(401).send('Invalid email or password');
    };

    // generate a jwt token with user data
    const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // send the token in the response
    res.json({token});
  } catch (error) {
    console.log("Error in Login");
    return res.status(500).send('Server error');
  }
});

module.exports = router;