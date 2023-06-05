const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');

const router = express.Router();

// get all courses
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM courses');
        const courses = result.rows;
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// get a course by id
router.get('/:id', async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const { userId } = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        const result = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
        const course = result.rows[0];
        const result2 = await pool.query('SELECT enrolled_courses FROM users WHERE id=$1', [userId]);
        const enrolledCourses = result2.rows[0].enrolledCourses || [];

        if (!enrolledCourses.includes(courseId)) {
            return res.status(401).send('You are not enrolled in this course');
        }
        const result3 = await pool.query('SELECT progress FROM course_progress WHERE user_id = $1 AND course_id = $2', [userId, courseId]);
        const progress = result3.rows[0]?.progress || 0;
        res.json({ ...course, progress });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// update a user's progress for a course
router.post('/:id/progress', async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const { userId } = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        const { progress } = req.body;
        await pool.query('INSERT INTO course_progress (user_id, course_id, progress VALUES ($1, $2, $3) ON CONFLICT (user_id, course_id) DO UPDATE SET progress = EXCLUDED.progress', [userId, courseId, progress]);
        res.send('Progress updated successfully');
    } catch(error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;