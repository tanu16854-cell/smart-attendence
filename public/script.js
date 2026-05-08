const API =
"https://smart-attendence-ek62.onrender.com";

/* ========================= */
/* SECTION SWITCH */
/* ========================= */

function showSection(id){

    document
    .querySelectorAll(".section")
    .forEach(sec=>{

        sec.classList.remove(
            "active-section"
        );
    });

    document
    .getElementById(id)
    .classList.add(
        "active-section"
    );
}

/* ========================= */
/* DATE & TIME */
/* ========================= */

function updateDateTime(){

    const now = new Date();

    document.getElementById(
        "liveDate"
    ).innerHTML =
    now.toDateString();

    document.getElementById(
        "liveTime"
    ).innerHTML =
    now.toLocaleTimeString();
}

setInterval(updateDateTime,1000);

updateDateTime();

/* ========================= */
/* ADD STUDENT */
/* ========================= */

function addStudent(){

    const id =
    document.getElementById("id")
    .value.trim();

    const name =
    document.getElementById("name")
    .value.trim();

    if(!id || !name){

        alert(
            "Enter Student ID & Name"
        );

        return;
    }

    fetch(API + "/add-student",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            id,
            name
        })
    })

    .then(res=>res.json())

    .then(data=>{

        alert(data.message);

        loadStudents();

        document.getElementById(
            "id"
        ).value = "";

        document.getElementById(
            "name"
        ).value = "";
    });
}

/* ========================= */
/* LOAD STUDENTS */
/* ========================= */

function loadStudents(){

    fetch(API + "/students")

    .then(res=>res.json())

    .then(data=>{

        let html = "";

        data.forEach(s=>{

            html += `

            <div class="student-card">

                <span>
                    👨‍🎓 ${s.name}
                </span>

                <select id="status-${s.id}">

                    <option value="Present">
                        Present
                    </option>

                    <option value="Absent">
                        Absent
                    </option>

                </select>

                <button
                onclick="removeStudent('${s.id}')">

                    Remove

                </button>

            </div>

            `;
        });

        document.getElementById(
            "studentList"
        ).innerHTML = html;
    });
}

/* ========================= */
/* MARK ATTENDANCE */
/* ========================= */

function submitAttendance(){

    const selectedDate =
    document.getElementById(
        "attendanceDate"
    ).value;

    if(!selectedDate){

        alert(
            "Select Attendance Date"
        );

        return;
    }

    fetch(API + "/students")

    .then(res=>res.json())

    .then(data=>{

        let records =
        data.map(s=>({

            id:s.id,

            status:
            document.getElementById(
            `status-${s.id}`
            ).value,

            date:selectedDate
        }));

        return fetch(
            API + "/mark-attendance",
            {

                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({
                    records
                })
            }
        );
    })

    .then(res=>res.text())

    .then(msg=>{

        alert(msg);
    });
}

/* ========================= */
/* MONTHLY REPORT */
/* ========================= */

function loadMonthlyReport(){

    const month =
    document.getElementById(
        "reportMonth"
    ).value;

    if(!month){

        alert("Select Month");

        return;
    }

    fetch(
        API + "/monthly-report/" + month
    )

    .then(res=>res.json())

    .then(data=>{

        let html = `

        <tr>

            <th>Date</th>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>

        </tr>

        `;

        data.forEach(r=>{

            html += `

            <tr>

                <td>
                    ${new Date(r.date)
                    .toLocaleDateString()}
                </td>

                <td>
                    ${r.student_id}
                </td>

                <td>
                    ${r.name}
                </td>

                <td>
                    ${r.status}
                </td>

            </tr>

            `;
        });

        document.getElementById(
            "reportTable"
        ).innerHTML = html;
    });
}

/* ========================= */
/* REMOVE STUDENT */
/* ========================= */

function removeStudent(id){

    fetch(API + "/remove-student",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({id})
    })

    .then(res=>res.json())

    .then(data=>{

        alert(data.message);

        loadStudents();
    });
}

/* ========================= */
/* WINDOW LOAD */
/* ========================= */

window.onload = function(){

    loadStudents();

    const today =
    new Date()
    .toISOString()
    .split("T")[0];

    document.getElementById(
        "attendanceDate"
    ).value = today;
};
function loadCharts(){

    fetch(API + "/report")
    .then(res => res.json())
    .then(data => {

        let p = 0, a = 0;

        data.forEach(d => {
            p += Number(d.present);
            a += Number(d.absent);
        });

        new Chart(document.getElementById("pieChart"), {
            type: "pie",
            data: {
                labels: ["Present","Absent"],
                datasets: [{ data:[p,a] }]
            }
        });

        new Chart(document.getElementById("barChart"), {
            type: "bar",
            data: {
                labels: data.map(d => d.name),
                datasets: [{ data: data.map(d => d.present) }]
            }
        });

    });
}
window.onload = function(){
    loadStudents();
    loadCharts();
};