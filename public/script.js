const API = "";

function addStudent() {
    const id = document.getElementById("id").value;
    const name = document.getElementById("name").value;

    fetch(API + "/student", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ id, name })
    })
    .then(res => res.text())
    .then(msg => {
        alert(msg);
        loadStudents(); // auto refresh
    });
}

function loadStudents() {
    fetch(API + "/students")
    .then(res => res.json())
    .then(data => {
        let html = "";

        data.forEach(s => {
            html += `
                <div class="student-card">
                    <span>${s.name}</span>

                    <select id="${s.id}">
                        <option>Present</option>
                        <option>Absent</option>
                    </select>

                    <button onclick="removeStudent('${s.id}')">❌ Remove</button>
                </div>
            `;
        });

        document.getElementById("studentList").innerHTML = html;
    });
}

function submitAttendance() {
    fetch(API + "/students")
    .then(res => res.json())
    .then(data => {
        let records = data.map(s => ({
            id: s.id,
            status: document.getElementById(s.id).value
        }));

        fetch(API + "/mark-attendance", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ records })
        })
        .then(res => res.text())
        .then(msg => alert(msg));
    });
}

function loadReport() {
    fetch(API + "/report")
    .then(res => res.json())
    .then(data => {
        let html = "<tr><th>ID</th><th>Name</th><th>%</th></tr>";

        data.forEach(s => {
            let percent = s.total == 0 ? 0 : (s.present * 100 / s.total).toFixed(2);
            html += `<tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${percent}%</td>
            </tr>`;
        });

        document.getElementById("reportTable").innerHTML = html;
    });
}

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
    });
}

window.onload = function() {
    loadStudents();
    loadChart();
};
function removeStudent(id) {
    fetch(API + "/remove-student", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            loadStudents(); // refresh list
        } else {
            alert("Delete failed");
        }
    })
    .catch(err => {
        console.log(err);
        alert("Server error");
    });
}