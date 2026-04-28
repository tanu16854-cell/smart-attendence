const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* ========== ROOT ROUTE ========== */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* ========== INIT DB (SAFE) ========== */
function initDB() {
    db.query(`CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(50)
    )`, (err) => {
        if (err) console.log("Students table error:", err.message);
        else console.log("Students table ready");
    });

    db.query(`CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(10),
        date DATE,
        status VARCHAR(10)
    )`, (err) => {
        if (err) console.log("Attendance table error:", err.message);
        else console.log("Attendance table ready");
    });
}

initDB();

/* ========== ADD STUDENT ========== */
app.post("/add-student", (req, res) => {
    const { id, name } = req.body;

    if (!id || !name) {
        return res.status(400).json({ error: "ID and Name required" });
    }

    db.query(
        "INSERT INTO students (id, name) VALUES (?, ?)",
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
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

/* ========== REMOVE STUDENT ========== */
app.post("/remove-student", (req, res) => {
    const { id } = req.body;

    db.query("DELETE FROM students WHERE id = ?", [id], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ success: false, error: err.message });
        }

        res.json({
            success: true,
            message: "Student Removed!"
        });
    });
});

/* ========== MARK ATTENDANCE (FIXED SAFE LOOP) ========== */
app.post("/mark-attendance", (req, res) => {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
        return res.status(400).send("Invalid data");
    }

    let completed = 0;

    records.forEach((r) => {
        db.query(
            "INSERT INTO attendance (student_id, date, status) VALUES (?, CURDATE(), ?)",
            [r.id, r.status],
            (err) => {
                if (err) console.log("ATT ERROR:", err.message);

                completed++;
                if (completed === records.length) {
                    res.send("Attendance Marked!");
                }
            }
        );
    });
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
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
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

/* ========== START SERVER ========== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});