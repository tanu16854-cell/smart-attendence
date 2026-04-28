const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
db.query(`
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50)
)
`);

db.query(`
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10),
    date DATE,
    status VARCHAR(10)
)
`);
/* ========== ROUTES START ========== */

/* Add Student */
app.post("/add-student", (req, res) => {
    const { id, name } = req.body;

    if (!id || !name) {
        return res.status(400).send("ID and Name required");
    }

    const sql = "INSERT INTO students (id, name) VALUES (?, ?)";
    db.query(sql, [id, name], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Student Added!");
    });
});

/* Get Students */
app.get("/students", (req, res) => {
    db.query("SELECT * FROM students", (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

/* Remove Student ⭐ NEW */
app.post("/remove-student", (req, res) => {
    const { id } = req.body;

    db.query("DELETE FROM students WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ success: false });

        res.json({
            success: true,
            message: "Student Removed!"
        });
    });
});

/* Mark Attendance */
app.post("/mark-attendance", (req, res) => {
    const { records } = req.body;

    records.forEach(r => {
        db.query(
            "INSERT INTO attendance (student_id, date, status) VALUES (?, CURDATE(), ?)",
            [r.id, r.status]
        );
    });

    res.send("Attendance Marked!");
});

/* Report */
app.get("/report", (req, res) => {
    const sql = `
        SELECT s.id, s.name,
        SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) AS present,
        COUNT(a.id) AS total
        FROM students s
        LEFT JOIN attendance a ON s.id=a.student_id
        GROUP BY s.id
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

/* Login */
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "1234") {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

/* ========== SERVER START LAST ========== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);