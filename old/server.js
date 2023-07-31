require('dotenv').config(); // load environment variables from env file
const express = require('express');
const cors = require('cors');
const usersRouter = require('./routes/users');
const coursesRouter = require('./routes/courses');
const adminCoursesRouter = require('./routes/admin_courses');
const adminUsersRouter = require('./routes/admin_users');
const courseEnrollmentsRouter = require('./routes/course_enrollments');
const jwt = require('jsonwebtoken');

const app = express();

var corsOptions = {
    origin: "http://localhost:3000",
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// tell a route to look for a GET request on the root / url and return some JSON
app.get('/', (request, response) => {
    response.json({ 
        info: 'Node.js, Express and Postgres API'
    });
}); 

// Generate a new random secret key and set it as an environment variable
const secretKey = jwt.sign({ data: 'random' }, process.env.JWT_SECRET);

// Set the secret key as an environment variable
process.env.JWT_SECRET = secretKey;

app.use('/users', usersRouter);
app.use('/courses', coursesRouter);
app.use('/admin', adminCoursesRouter);
app.use('/admin', adminUsersRouter);
app.use('/enrollment', courseEnrollmentsRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));