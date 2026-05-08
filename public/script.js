const API = "https://smart-attendence-ek62.onrender.com";

/* ============================= */
/* ERP SECTION SWITCH */
/* ============================= */

function showSection(id){

    document.querySelectorAll(".section")
    .forEach(sec=>{
        sec.classList.remove("active-section");
    });

    document.getElementById(id)
    .classList.add("active-section");
}

/* ============================= */
/* LIVE DATE & TIME */
/* ============================= */

function updateDateTime(){

    const now = new Date();

    document.getElementById("liveDate").innerHTML =
        now.toDateString();

    document.getElementById("liveTime").innerHTML =
        now.toLocaleTimeString();
}

setInterval(updateDateTime,1000);

updateDateTime();

/* ============================= */
/* ADD STUDENT */
/* ============================= */

function addStudent() {

    const id = document.getElementById("id").value.trim();

    const name = document.getElementById("name").value.trim();

    if (!id || !name) {

        alert("Student ID and Name required");

        return;
    }

    fetch(API + "/add-student", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            id,
            name
        })

    })

    .then(res => res.json())

    .then(data => {

        alert(data.message || data.error);

        document.getElementById("id").value = "";

        document.getElementById("name").value = "";

        loadStudents();

        loadChart();
    })

    .catch(err => {

        console.log(err);

        alert("Server Error");
    });
}

/* ============================= */
/* LOAD STUDENTS */
/* ============================= */

function loadStudents() {

    fetch(API + "/students")

    .then(res => res.json())

    .then(data => {

        let html = "";

        data.forEach(s => {

            html += `

            <div class="student-card">

                <span>
                    👨‍🎓 ${s.name}
                </span>

                <select id="status-${s.id}">

                    <option value="Present">
                        ✅ Present
                    </option>

                    <option value="Absent">
                        ❌ Absent
                    </option>

                </select>

                <button onclick="removeStudent('${s.id}')">
                    Remove
                </button>

            </div>

            `;
        });

        document.getElementById("studentList").innerHTML = html;
    })

    .catch(err => {

        console.log(err);
    });
}

/* ============================= */
/* MARK ATTENDANCE */
/* ============================= */

function submitAttendance() {

    const selectedDate =
        document.getElementById("attendanceDate").value;

    if (!selectedDate) {

        alert("Please select attendance date");

        return;
    }

    fetch(API + "/students")

    .then(res => res.json())

    .then(data => {

        let records = data.map(s => ({

            id: s.id,

            status:
            document.getElementById(`status-${s.id}`).value,

            date: selectedDate

        }));

        return fetch(API + "/mark-attendance", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                records
            })
        });
    })

    .then(res => res.text())

    .then(msg => {

        alert(msg);

        loadChart();
    })

    .catch(err => {

        console.log(err);

        alert("Attendance Error");
    });
}

/* ============================= */
/* LOAD REPORT */
/* ============================= */
/* ============================= */
/* MONTHLY REPORT */
/* ============================= */

function loadMonthlyReport() {

    const month =
    document.getElementById("reportMonth").value;

    if(!month){

        alert("Select Month");

        return;
    }

    fetch(API + "/monthly-report/" + month)

    .then(res => res.json())

    .then(data => {

        let html = `

        <tr>
            <th>Date</th>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
        </tr>

        `;

        data.forEach(r => {

            html += `

            <tr>

                <td>
                    ${new Date(r.date)
                    .toLocaleDateString()}
                </td>

                <td>${r.student_id}</td>

                <td>${r.name}</td>

                <td>${r.status}</td>

            </tr>

            `;
        });

        document.getElementById("reportTable")
        .innerHTML = html;
    })

    .catch(err => {

        console.log(err);

        alert("Report Error");
    });
}

/* ============================= */
/* LOAD CHART */
/* ============================= */

function loadChart() {

    fetch(API + "/report")

    .then(res => res.json())

    .then(data => {

        let names =
        data.map(s => s.name);

        let percent =
        data.map(s =>

            s.total == 0
            ? 0
            : (s.present * 100 / s.total)
        );

        const ctx =
        document.getElementById("chart");

        if(window.attendanceChart){

            window.attendanceChart.destroy();
        }

        window.attendanceChart =
        new Chart(ctx, {

            type: "bar",

            data: {

                labels: names,

                datasets: [{

                    label: "Attendance Percentage",

                    data: percent,

                    borderWidth: 1
                }]
            },

            options: {

                responsive: true,

                scales: {

                    y: {

                        beginAtZero: true,

                        max: 100
                    }
                }
            }
        });
    })

    .catch(err => {

        console.log(err);
    });
}

/* ============================= */
/* REMOVE STUDENT */
/* ============================= */

function removeStudent(id) {

    fetch(API + "/remove-student", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            id
        })
    })

    .then(res => res.json())

    .then(data => {

        alert(data.message || "Student Removed");

        loadStudents();

        loadChart();
    })

    .catch(err => {

        console.log(err);

        alert("Delete Error");
    });
}

/* ============================= */
/* ERP DASHBOARD LOAD */
/* ============================= */

window.onload = function () {

    loadStudents();

    loadChart();

    loadReport();

    const today = new Date()
    .toISOString()
    .split("T")[0];

    document.getElementById("attendanceDate").value =
    today;
};