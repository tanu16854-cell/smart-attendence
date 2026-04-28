const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ========== ROOT ROUTE ========== */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* ========== SAFE TABLE INIT ========== */
db.query(`
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50)
)
`);

db.query(`
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(10),
    date DATE,
    status VARCHAR(10)
)
`);

/* ========== ADD STUDENT ========== */
app.post("/add-student", (req, res) => {
    const { id, name } = req.body;

    if (!id || !name) {
        return res.status(400).json({ error: "ID and Name required" });
    }

    db.query(
        "INSERT INTO students (id, name) VALUES ($1, $2)",
        [id, name],
        (err) => {
            if (err) {
                console.log("ADD ERROR:", err.message);
                return res.status(500).json({ error: err.message });
            }

            res.json({ message: "Student Added Successfully" });
        }
    );
});

/* ========== GET STUDENTS ========== */
app.get("/students", (req, res) => {
    db.query("SELECT * FROM students", (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result.rows);
    });
});

/* ========== REMOVE STUDENT ========== */
app.post("/remove-student", (req, res) => {
    const { id } = req.body;

    db.query("DELETE FROM students WHERE id = $1", [id], (err) => {
        if (err) {
            console.log(err.message);
            return res.status(500).json({ success: false });
        }

        res.json({
            success: true,
            message: "Student Removed!"
        });
    });
});

/* ========== MARK ATTENDANCE ========== */
app.post("/mark-attendance", (req, res) => {
    const { records } = req.body;

    if (!records) return res.status(400).send("No records");

    records.forEach(r => {
        db.query(
            "INSERT INTO attendance (student_id, date, status) VALUES ($1, CURRENT_DATE, $2)",
            [r.id, r.status],
            (err) => {
                if (err) console.log("ATTENDANCE ERROR:", err.message);
            }
        );
    });

    res.send("Attendance Marked!");
});

/* ========== REPORT ========== */
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
        if (err) return res.status(500).json({ error: err.message });
        res.json(result.rows);
    });
});

/* ========== LOGIN ========== */
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "1234") {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

/* ========== SERVER START ========== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});