const API = "https://smart-attendence-ek62.onrender.com";

/* ========== ADD STUDENT ========== */
function addStudent() {
    const id = document.getElementById("id").value.trim();
    const name = document.getElementById("name").value.trim();

    if (!id || !name) {
        alert("ID and Name required");
        return;
    }

    fetch(API + "/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || data.error);
        loadStudents();
    })
    .catch(err => {
        console.log(err);
        alert("Server error");
    });
}

/* ========== LOAD STUDENTS ========== */
function loadStudents() {
    fetch(API + "/students")
    .then(res => res.json())
    .then(data => {
        let html = "";

        data.forEach(s => {
            html += `
                <div class="student-card">
                    <span>${s.name}</span>

                    <select id="status-${s.id}">
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>

                    <button onclick="removeStudent('${s.id}')">❌ Remove</button>
                </div>
            `;
        });

        document.getElementById("studentList").innerHTML = html;
    })
    .catch(err => console.log(err));
}

/* ========== MARK ATTENDANCE ========== */
function submitAttendance() {
    fetch(API + "/students")
    .then(res => res.json())
    .then(data => {

        let records = data.map(s => ({
            id: s.id,
            status: document.getElementById(`status-${s.id}`).value
        }));

        return fetch(API + "/mark-attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records })
        });
    })
    .then(res => res.text())
    .then(msg => alert(msg))
    .catch(err => {
        console.log(err);
        alert("Error marking attendance");
    });
}

/* ========== REPORT ========== */
function loadReport() {
    fetch(API + "/report")
    .then(res => res.json())
    .then(data => {

        let html = "<tr><th>ID</th><th>Name</th><th>%</th></tr>";

        data.forEach(s => {
            let percent = s.total == 0 ? 0 : (s.present * 100 / s.total).toFixed(2);

            html += `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.name}</td>
                    <td>${percent}%</td>
                </tr>
            `;
        });

        document.getElementById("reportTable").innerHTML = html;
    })
    .catch(err => console.log(err));
}

/* ========== CHART ========== */
function loadChart() {
    fetch(API + "/report")
    .then(res => res.json())
    .then(data => {

        let names = data.map(s => s.name);
        let percent = data.map(s =>
            s.total == 0 ? 0 : (s.present * 100 / s.total)
        );

        new Chart(document.getElementById("chart"), {
            type: "bar",
            data: {
                labels: names,
                datasets: [{
                    label: "Attendance %",
                    data: percent
                }]
            }
        });
    })
    .catch(err => console.log(err));
}

/* ========== REMOVE STUDENT ========== */
function removeStudent(id) {
    fetch(API + "/remove-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || "Done");
        loadStudents();
    })
    .catch(err => {
        console.log(err);
        alert("Server error");
    });
}

/* ========== ON LOAD ========== */
window.onload = function () {
    loadStudents();
    loadChart();
};