const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();

/* ============================= */
/* MIDDLEWARE */
/* ============================= */

app.use(cors());
app.use(express.json());

app.use(express.static(
    path.join(__dirname, "public")
));

/* ============================= */
/* ROOT ROUTE */
/* ============================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "login.html")
    );
});

/* ============================= */
/* DATABASE TABLES */
/* ============================= */

db.query(`

CREATE TABLE IF NOT EXISTS students(

    id VARCHAR(20) PRIMARY KEY,

    name VARCHAR(100)

)

`);

db.query(`

CREATE TABLE IF NOT EXISTS attendance(

    id SERIAL PRIMARY KEY,

    student_id VARCHAR(20),

    date DATE,

    status VARCHAR(20)

)

`);

/* ============================= */
/* TEACHERS TABLE */
/* ============================= */

db.query(`

CREATE TABLE IF NOT EXISTS teachers(

    id SERIAL PRIMARY KEY,

    teacher_name VARCHAR(100),

    subject VARCHAR(100),

    class_name VARCHAR(100)

)

`);

/* ============================= */
/* LOGIN API */
/* ============================= */

app.post("/login", (req, res) => {

    const { username, password } = req.body;

    if(
        username === "admin" &&
        password === "1234"
    ){

        res.json({
            success:true
        });

    }else{

        res.json({
            success:false
        });
    }
});

/* ============================= */
/* ADD STUDENT */
/* ============================= */

app.post("/add-student", (req, res) => {

    const { id, name } = req.body;

    if(!id || !name){

        return res.status(400).json({
            error:"ID and Name required"
        });
    }

    db.query(

        "INSERT INTO students(id,name) VALUES($1,$2)",

        [id,name],

        (err)=>{

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json({
                message:"Student Added Successfully"
            });
        }
    );
});

/* ============================= */
/* GET STUDENTS */
/* ============================= */

app.get("/students", (req, res) => {

    db.query(

        "SELECT * FROM students ORDER BY name",

        (err,result)=>{

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json(result.rows);
        }
    );
});

/* ============================= */
/* REMOVE STUDENT */
/* ============================= */

app.post("/remove-student", (req,res)=>{

    const { id } = req.body;

    db.query(

        "DELETE FROM students WHERE id=$1",

        [id],

        (err)=>{

            if(err){

                return res.status(500).json({
                    success:false
                });
            }

            res.json({

                success:true,

                message:"Student Removed Successfully"
            });
        }
    );
});

/* ============================= */
/* ADD TEACHER */
/* ============================= */

app.post("/add-teacher",(req,res)=>{

    const {
        teacher_name,
        subject,
        class_name
    } = req.body;

    if(
        !teacher_name ||
        !subject ||
        !class_name
    ){

        return res.status(400).json({
            error:"All fields required"
        });
    }

    db.query(

        `

        INSERT INTO teachers
        (teacher_name,subject,class_name)

        VALUES($1,$2,$3)

        `,

        [
            teacher_name,
            subject,
            class_name
        ],

        (err)=>{

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json({
                message:"Teacher Added Successfully"
            });
        }
    );
});

/* ============================= */
/* GET TEACHERS */
/* ============================= */

app.get("/teachers",(req,res)=>{

    db.query(

        "SELECT * FROM teachers ORDER BY id DESC",

        (err,result)=>{

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json(result.rows);
        }
    );
});

/* ============================= */
/* DELETE TEACHER */
/* ============================= */

app.post("/remove-teacher",(req,res)=>{

    const { id } = req.body;

    db.query(

        "DELETE FROM teachers WHERE id=$1",

        [id],

        (err)=>{

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json({
                message:"Teacher Removed"
            });
        }
    );
});

/* ============================= */
/* MARK ATTENDANCE */
/* ============================= */

app.post("/mark-attendance", (req,res)=>{

    const { records } = req.body;

    if(!records){

        return res.status(400).send(
            "No Attendance Records"
        );
    }

    records.forEach(r=>{

        db.query(

            `

            INSERT INTO attendance
            (student_id,date,status)

            VALUES($1,$2,$3)

            `,

            [
                r.id,
                r.date,
                r.status
            ],

            (err)=>{

                if(err){

                    console.log(err.message);
                }
            }
        );
    });

    res.send(
        "Attendance Marked Successfully"
    );
});

/* ============================= */
/* OVERALL REPORT */
/* ============================= */

app.get("/report",(req,res)=>{

    const sql = `

    SELECT

    students.id,

    students.name,

    SUM(
        CASE
        WHEN attendance.status='Present'
        THEN 1
        ELSE 0
        END
    ) AS present,

    SUM(
        CASE
        WHEN attendance.status='Absent'
        THEN 1
        ELSE 0
        END
    ) AS absent,

    COUNT(attendance.id) AS total

    FROM students

    LEFT JOIN attendance

    ON students.id=attendance.student_id

    GROUP BY students.id

    ORDER BY students.name

    `;

    db.query(sql,(err,result)=>{

        if(err){

            return res.status(500).json({
                error:err.message
            });
        }

        res.json(result.rows);
    });
});

/* ============================= */
/* MONTHLY REPORT */
/* ============================= */

app.get("/monthly-report/:month",(req,res)=>{

    const month = req.params.month;

    const sql = `

    SELECT

    attendance.date,

    attendance.student_id,

    students.name,

    attendance.status

    FROM attendance

    JOIN students

    ON students.id =
    attendance.student_id

    WHERE TO_CHAR(
        attendance.date,
        'YYYY-MM'
    ) = $1

    ORDER BY attendance.date DESC

    `;

    db.query(

        sql,

        [month],

        (err,result)=>{

            if(err){

                return res.status(500).json({
                    error:err.message
                });
            }

            res.json(result.rows);
        }
    );
});

/* ============================= */
/* SERVER START */
/* ============================= */

const PORT =
process.env.PORT || 3000;

app.listen(PORT, ()=>{

    console.log(
        "ERP Server Running On Port",
        PORT
    );
});