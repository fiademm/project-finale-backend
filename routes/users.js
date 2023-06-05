const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');

const router = express.Router();

// user signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id', [name, email, hashedPassword]);
        const userId = result.rows[0].id;
        const token = jwt.sign({ userId }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error');
    }
});

// user login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).send('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send('Invalid email or password');
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Server error');
    }
});


// enroll in a course
router.post('/enroll', async (req, res) => {
    try {
        const { courseId } = req.body;
        const { userId } = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        const result = await pool.query('SELECT enrolled_courses FROM users WHERE id = $1', [userId]);
        const enrolledCourses = result.rows[0].enrolled_courses || [];
        if (enrolledCourses.includes(courseId)) {
            return res.status(400).send('You have already enrolled n ths course');
        }
        enrolledCourses.push(courseId);
        await pool.query('UPDATE users SET enrolled_courses = $1 where id = $2', [enrolledCourses, userId]);
        res.send('Enrolled successfully');
        } catch (error) {
            console.error(error);
            return res.status(500).send('Server error');
        }
});

module.exports = router;