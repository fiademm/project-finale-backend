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
        const result = await pool.query('INSERT INTO learner (name, emailAddress, password) VALUES ($1, $2, $3) RETURNING id', [name, emailAddress, hashedPassword]);
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
    const user = await pool.query('SELECT * FROM learner WHERE emailAddress = $1', [emailAddress]);

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

// // user login
// router.post('/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//         const user = result.rows[0];
//         if (!user) {
//             return res.status(401).send('Invalid email or password');
//         }
//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if (!isPasswordValid) {
//             return res.status(401).send('Invalid email or password');
//         }
//         const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
//        // const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1' });
//         res.json({ token });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).send('Server error');
//     }
// });

  // router.post('/enroll', async (req, res) => {
  //   try {
  //     const { courseId } = req.body;
  //     const authHeader = req.headers.authorization;
  //     if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //       return res.status(401).send('Missing or invalid Authorization header');
  //     }
  //     const token = authHeader.split(' ')[1];
  //     const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  //     const userId = decodedToken.userId;
  //     const result = await pool.query('SELECT enrolled_courses FROM users WHERE id = $1', [userId]);
  //     const enrolledCourses = result.rows[0]?.enrolled_courses ?? [];
  //     if (enrolledCourses.includes(courseId)) {
  //       return res.status(400).send('You have already enrolled in this course');
  //     }
  //     const newEnrolledCourses = [...enrolledCourses, courseId];
  //     await pool.query('UPDATE users SET enrolled_courses = $1 WHERE id = $2', [newEnrolledCourses, userId]);
  //     res.send('Enrolled successfully');
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).send('Server error');
  //   }
  // });

module.exports = router;