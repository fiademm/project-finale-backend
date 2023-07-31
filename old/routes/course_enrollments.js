const express = require('express');
const pool = require('../db.js');
const authenticateJWT = require('./authMiddleware');

const router = express.Router();

// Enroll in a course (Requires a valid JWT token)
router.post('/courses/:courseId/enroll', authenticateJWT, async (req, res) => {
  const { courseId } = req.params;
  const { userId } = req.user; // userId is extracted from the verified JWT token

  try {
    // Check if the learner is already enrolled in the course
    const enrollmentCheck = await pool.query(
      'SELECT * FROM course_enrollments WHERE learner_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (enrollmentCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }

    // Enroll the learner in the course
    await pool.query(
      'INSERT INTO course_enrollments (learner_id, course_id) VALUES ($1, $2)',
      [userId, courseId]
    );

    res.json({ message: 'Enrolled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/enroll', async (req, res) => {
    try {
      const { courseId } = req.body;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Missing or invalid Authorization header');
      }
      const token = authHeader.split(' ')[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.userId;
      const result = await pool.query('SELECT enrolled_courses FROM users WHERE id = $1', [userId]);
      const enrolledCourses = result.rows[0]?.enrolled_courses ?? [];
      if (enrolledCourses.includes(courseId)) {
        return res.status(400).send('You have already enrolled in this course');
      }
      const newEnrolledCourses = [...enrolledCourses, courseId];
      await pool.query('UPDATE users SET enrolled_courses = $1 WHERE id = $2', [newEnrolledCourses, userId]);
      res.send('Enrolled successfully');
    } catch (error) {
      console.error(error);
      return res.status(500).send('Server error');
    }
  });


module.exports = router;
