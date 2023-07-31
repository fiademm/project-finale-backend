require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pg = require('pg');

const app = express();
var corsOptions = {
    origin: "http://localhost:3000",
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const jwtSecret = '1087C7B5162307CE7C5AE4B2C5D207166D424842C0571E00FFCEDED5C065EBFA';


// Middleware for authenticating requests with JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Middleware for authorizing requests based on role
const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user.role === role) {
            next();
        } else {
            res.sendStatus(403);
        }
    };
};

// Create PostgreSQL pool for handling database connections
const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mydatabase',
    password: 'mypassword',
    port: 5432,
});

// Endpoint for getting all courses
app.get('/courses', authenticateJWT, (req, res) => {
    pool.query('SELECT * FROM course', [], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error retrieving courses');
        } else {
            res.status(200).json(results.rows);
        }
    });
});

// Endpoint for getting a course by id
app.get('/courses/:id', authenticateJWT, (req, res) => {
    const courseId = req.params.id;

    pool.query('SELECT * FROM course WHERE id = $1', [courseId], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error retrieving course');
        } else if (results.rowCount === 0) {
            res.status(404).send('Course not found');
        } else {
            res.status(200).json(results.rows[0]);
        }
    });
});

// Endpoint for updating course details
app.put('/courses/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
    const courseId = req.params.id;
    const { title, description, instructor_id, rating, totalVideos, totalHours, totalLectures, detailedDescription, courseOutline, category_id, thumbnail } = req.body;

    pool.query('UPDATE course SET title = $1, description = $2, instructor_id = $3, rating = $4, totalVideos = $5, totalHours = $6, totalLectures = $7, detailedDescription = $8, courseOutline = $9, category_id = $10, thumbnail = $11 WHERE id = $12', [title, description, instructor_id, rating, totalVideos, totalHours, totalLectures, detailedDescription, courseOutline, category_id, thumbnail, courseId], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error updating course');
        } else if (results.rowCount === 0) {
            res.status(404).send('Course not found');
        } else {
            res.status(200).send('Course updated successfully');
        }
    });
});

// Endpoint for updating progress of course enrollment
app.put('/course_enrollments/:id', authenticateJWT, authorizeRole('learner'), (req, res) => {
    const enrollmentId = req.params.id;
    const { progress } = req.body;

    pool.query('UPDATE course_enrollments SET progress = $1 WHERE id = $2', [progress, enrollmentId], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error updating progress');
        } else if (results.rowCount === 0) {
            res.status(404).send('Enrollment not found');
        } else {
            res.status(200).send('Progress updated successfully');
        }
    });
});

// Endpoint for deleting course by admin
app.delete('/courses/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
    const courseId = req.params.id;

    pool.query('DELETE FROM// course WHERE id = $1', [courseId], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error deleting course');
        } else if (results.rowCount === 0) {
            res.status(404).send('Course not found');
        } else {
            res.status(200).send('Course deleted successfully');
        }
    });
});

// Endpoint for adding new course by admin
app.post('/courses', authenticateJWT, authorizeRole('admin'), (req, res) => {
    const { title, description, instructor_id, rating, totalVideos, totalHours, totalLectures, detailedDescription, courseOutline, category_id, thumbnail } = req.body;

    pool.query('INSERT INTO course (title, description, instructor_id, rating, totalVideos, totalHours, totalLectures, detailedDescription, courseOutline, category_id, thumbnail) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', [title, description, instructor_id, rating, totalVideos, totalHours, totalLectures, detailedDescription, courseOutline, category_id, thumbnail], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error adding course');
        } else {
            res.status(201).send('Course added successfully');
        }
    });
});

// Endpoint for admin login
app.post('/login/admin', (req, res) => {
    const { emailAddress, password } = req.body;

    pool.query('SELECT * FROM admin WHERE emailAddress = $1', [emailAddress], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error logging in');
        } else if (results.rowCount === 0) {
            res.status(401).send('Invalid email or password');
        } else {
            const user = results.rows[0];

            bcrypt.compare(password, user.password, (err, result) => {
                if (err || !result) {
                    res.status(401).send('Invalid email or password');
                } else {
                    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '1h' });
                    res.status(200).json({ token });
                }
            });
        }
    });
});

// Endpoint for learner login
app.post('/login/learner', (req, res) => {
    const { emailAddress, password } = req.body;

    pool.query('SELECT * FROM learner WHERE emailAddress = $1', [emailAddress], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error logging in');
        } else if (results.rowCount === 0) {
            res.status(401).send('Invalid email or password');
        } else {
            const user = results.rows[0];

            bcrypt.compare(password, user.password, (err, result) => {
                if (err || !result) {
                    res.status(401).send('Invalid email or password');
                } else {
                    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '1h' });
                    res.status(200).json({ token });
                }
            });
        }
    });
});

// Endpoint for instructor login
app.post('/login/instructor', (req, res) => {
    const { emailAddress, password } = req.body;

    pool.query('SELECT * FROM instructor WHERE emailAddress = $1', [emailAddress], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error logging in');
        } else if (results.rowCount === 0) {
            res.status(401).send('Invalid email or password');
        } else {
            const user = results.rows[0];

            bcrypt.compare(password, user.password, (err, result) => {
                if (err || !result) {
                    res.status(401).send('Invalid email or password');
                } else {
                    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '1h' });
                    res.status(200).json({ token });
                }
            });
        }
    });
});

// Endpoint for learner signup
app.post('/signup/learner', (req, res) => {
    const { name, emailAddress, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error creating account');
        } else {
            pool.query('INSERT INTO learner (name, emailAddress, password) VALUES ($1, $2, $3)', [name, emailAddress, hash], (error, results) => {
                if (error) {
                    console.error(error);
                    res.status(500).send('Error creating account');
                } else {
                    res.status(201).send('Account created successfully');
                }
            });
        }
    });
});

// Endpoint for signing out
app.post('/signout', (req, res) => {
    res.sendStatus(200);
});

// Endpoint for fetching details of all learners
app.get('/learners', authenticateJWT, authorizeRole('admin'), (req, res) => {
    pool.query('SELECT * FROM learner', [], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error retrieving learners');
        } else {
            res.status(200).json(results.rows);
        }
    });
});

// Endpoint for fetching details of all instructors
app.get('/instructors', authenticateJWT, authorizeRole('admin'), (req, res) => {
    pool.query('SELECT * FROM instructor', [], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error retrieving instructors');
        } else {
            res.status(200).json(results.rows);
        }
    });
});

// Endpoint for fetching details of all admins
app.get('/admins', authenticateJWT, authorizeRole('admin'), (req, res) => {
    pool.query('SELECT * FROM admin', [], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error retrieving admins');
        } else {
            res.status(200).json(results.rows);
        }
    });
});

// Endpoint for fetching details of a learner by id
app.get('/learners/:id', authenticateJWT, authorizeRole(['admin', 'learner']), (req, res) => {
    const learnerId = req.params.id;

    pool.query('SELECT * FROM learner WHERE id = $1', [learnerId], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error retrieving learner');
        } else if (results.rowCount === 0) {
            res.status(404).send('Learner not found');
        } else if (req.user.role === 'learner' && req.user.id !== learnerId) {
            res.sendStatus(403);
        } else {
            res.status(200).json(results.rows[0]);
        }
    });
});

// Endpoint for fetching details of an instructor by id
app.get('/instructors/:id', authenticateJWT, authorizeRole(['admin', 'instructor']), (req, res) => {
    const instructorId = req.params.id;

    pool.query('SELECT * FROM instructor WHERE id = $1', [instructorId], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error retrieving instructor');
        } else if (results.rowCount === 0) {
            res.status(404).send('Instructor not found');
        } else if (req.user.role === 'instructor' && req.user.id !== instructorId) {
            res.sendStatus(403);
        } else {
            res.status(200).json(results.rows[0]);
        }
    });
});

// Endpoint for updating details of a learner by id
app.put('/learners/:id', authenticateJWT, authorizeRole(['admin', 'learner']), (req, res) => {
    const learnerId = req.params.id;
    const { name, emailAddress, password } = req.body;

    if (req.user.role === 'learner' && req.user.id !== learnerId) {
        res.sendStatus(403);
    } else {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error updating learner');
            } else {
                pool.query('UPDATE learner SET name = $1, emailAddress = $2, password = $3 WHERE id = $4', [name, emailAddress, hash, learnerId], (error, results) => {
                    if (error) {
                        console.error(error);
                        res.status(500).send('Error updating learner');
                    } else if (results.rowCount === 0) {
                        res.status(404).send('Learner not found');
                    } else {
                        res.status(200).send('Learner updated successfully');
                    }
                });
            }
        });
    }
});

// Endpoint for updating details of an instructor by id
app.put('/instructors/:id', authenticateJWT, authorizeRole(['admin', 'instructor']), (req, res) => {
    const instructorId = req.params.id;
    const { name, emailAddress, password } = req.body;

    if (req.user.role === 'instructor' && req.user.id !== instructorId) {
        res.sendStatus(403);
    } else {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error updating instructor');
            } else {
                pool.query('UPDATE instructor SET name = $1, emailAddress = $2, password = $3 WHERE id = $4', [name, emailAddress, hash, instructorId], (error, results) => {
                    if (error) {
                        console.error(error);
                        res.status(500).send('Error updating instructor');
                    } else if (results.rowCount === 0) {
                        res.status(404).send('Instructor not found');
                    } else {
                        res.status(200).send('Instructor updated successfully');
                    }
                });
            }
        });
    }
});

// Endpoint for deleting a learner by id
app.delete('/learners/:id', authenticateJWT, authorizeRole(['admin', 'learner']), (req, res) => {
    const learnerId = req.params.id;

    if (req.user.role === 'learner' && req.user.id !== learnerId) {
        res.sendStatus(403);
    } else {
        pool.query('DELETE FROM learner WHERE id = $1', [learnerId], (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).send('Error deleting learner');
            } else if (results.rowCount === 0) {
                res.status(404).send('Learner not found');
            } else {
                res.status(200).send('Learner deleted successfully');
            }
        });
    }
});

// Endpoint for deleting an instructor by id
app.delete('/instructors/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
    const instructorId = req.params.id;

    pool.query('DELETE FROM instructor WHERE id = $1', [instructorId], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error deleting instructor');
        } else if (results.rowCount === 0) {
            res.status(404).send('Instructor not found');
        } else {
            res.status(200).send('Instructor deleted successfully');
        }
    });
});

// Endpoint for deleting an admin by id
app.delete('/admins/:id', authenticateJWT, authorizeRole('admin'), (req, res) => {
    const adminId = req.params.id;

    pool.query('DELETE FROM admin WHERE id = $1', [adminId], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error deleting admin');
        } else if (results.rowCount === 0) {
            res.status(404).send('Admin not found');
        } else {
            res.status(200).send('Admin deleted successfully');
        }
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});