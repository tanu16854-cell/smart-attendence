const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

const SECRET = "smart_erp_secret_key";

/* ============================= */
/* MIDDLEWARE */
/* ============================= */

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

/* ============================= */
/* ROOT */
/* ============================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* ============================= */
/* TABLES */
/* ============================= */

db.query(`
CREATE TABLE IF NOT EXISTS students(
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100)
);
`);

db.query(`
CREATE TABLE IF NOT EXISTS attendance(
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20),
    date DATE,
    status VARCHAR(20)
);
`);

db.query(`
CREATE TABLE IF NOT EXISTS teachers(
    id SERIAL PRIMARY KEY,
    teacher_name VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(200),
    subject VARCHAR(100),
    role VARCHAR(20) DEFAULT 'teacher'
);
`);

/* ============================= */
/* REGISTER TEACHER (SECURE) */
/* ============================= */

app.post("/register-teacher", async (req, res) => {

    const { teacher_name, email, password, subject } = req.body;

    const hash = await bcrypt.hash(password, 10);

    db.query(
        `INSERT INTO teachers (teacher_name,email,password,subject)
         VALUES ($1,$2,$3,$4)`,
        [teacher_name, email, hash, subject],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ message: "Teacher Registered Successfully" });
        }
    );
});

/* ============================= */
/* LOGIN (JWT + BCRYPT) */
/* ============================= */

app.post("/login", (req, res) => {

    const { username, password } = req.body;

    db.query(
        `SELECT * FROM teachers WHERE email=$1`,
        [username],
        async (err, result) => {

            if (err) return res.status(500).json({ error: err.message });

            if (result.rows.length === 0)
                return res.json({ success: false });

            const teacher = result.rows[0];

            const match = await bcrypt.compare(password, teacher.password);

            if (!match)
                return res.json({ success: false });

            const token = jwt.sign({ id: teacher.id }, SECRET, {
                expiresIn: "2h"
            });

            res.json({
                success: true,
                token,
                teacher
            });
        }
    );
});

/* ============================= */
/* STUDENT APIs */
/* ============================= */

app.post("/add-student", (req, res) => {

    const { id, name } = req.body;

    db.query(
        `INSERT INTO students(id,name) VALUES($1,$2)`,
        [id, name],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ message: "Student Added" });
        }
    );
});

app.get("/students", (req, res) => {

    db.query(`SELECT * FROM students`, (err, result) => {

        if (err) return res.status(500).json({ error: err.message });

        res.json(result.rows);
    });
});

app.post("/remove-student", (req, res) => {

    db.query(
        `DELETE FROM students WHERE id=$1`,
        [req.body.id],
        (err) => {
            if (err) return res.status(500).json({ success: false });

            res.json({ success: true });
        }
    );
});

/* ============================= */
/* ATTENDANCE */
/* ============================= */

app.post("/mark-attendance", (req, res) => {

    const { records } = req.body;

    records.forEach(r => {

        db.query(
            `INSERT INTO attendance(student_id,date,status)
             VALUES($1,$2,$3)`,
            [r.id, r.date, r.status]
        );
    });

    res.send("Attendance Saved");
});

/* ============================= */
/* REPORT */
/* ============================= */

app.get("/report", (req, res) => {

    db.query(`
        SELECT
        students.id,
        students.name,
        SUM(CASE WHEN attendance.status='Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN attendance.status='Absent' THEN 1 ELSE 0 END) as absent
        FROM students
        LEFT JOIN attendance
        ON students.id=attendance.student_id
        GROUP BY students.id
    `, (err, result) => {

        if (err) return res.status(500).json({ error: err.message });

        res.json(result.rows);
    });
});

/* ============================= */
/* MONTHLY REPORT */
/* ============================= */

app.get("/monthly-report/:month", (req, res) => {

    const month = req.params.month;

    db.query(`
        SELECT attendance.date, attendance.student_id, students.name, attendance.status
        FROM attendance
        JOIN students ON students.id=attendance.student_id
        WHERE TO_CHAR(attendance.date,'YYYY-MM')=$1
    `, [month], (err, result) => {

        if (err) return res.status(500).json({ error: err.message });

        res.json(result.rows);
    });
});

/* ============================= */
/* SERVER */
/* ============================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});