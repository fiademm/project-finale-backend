const express = require('express');
const pool = require('../db.js');
const authenticateJWT = require('./authMiddleware');

const router = express.Router();

// Add a new course (Requires a valid JWT token and role=admin)
router.post('/courses', authenticateJWT, async (req, res) => {
  const { title, description, instructor_id } = req.body;
  const { role } = req.user; // Role is extracted from the verified JWT token

  try {
    // Check if the user is an admin
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins are allowed to add courses' });
    }

    // Add the course to the database
    const newCourse = await pool.query(
      'INSERT INTO courses (title, description, instructor_id) VALUES ($1, $2, $3) RETURNING *',
      [title, description, instructor_id]
    );

    res.json(newCourse.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Fetch all courses (Requires a valid JWT token and role=admin)
router.get('/courses', authenticateJWT, async (req, res) => {
  const { role } = req.user; // Role is extracted from the verified JWT token

  try {
    // Check if the user is an admin
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins are allowed to fetch all courses' });
    }

    // Fetch all courses from the database
    const courses = await pool.query('SELECT * FROM courses');
    res.json(courses.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});


module.exports = router;

