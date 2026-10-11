
const API = "/api/students";

const form = document.getElementById("studentForm");
const table = document.getElementById("studentTable");
const message = document.getElementById("message");
const searchInput = document.getElementById("searchInput");

let students = [];

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function isPassed(student) {
    return [
        student.subject1,
        student.subject2,
        student.subject3,
        student.subject4,
        student.subject5
    ].every(mark => mark >= 40);
}

function getGrade(percentage) {
    if (percentage >= 90) return "A+";
    if (percentage >= 75) return "A";
    if (percentage >= 60) return "B";
    if (percentage >= 40) return "C";
    return "Fail";
}

async function loadStudents() {
    try {
        const response = await fetch(API);

        if (!response.ok) {
            throw new Error("Could not load student records.");
        }

        students = await response.json();
        renderStudents();
        updateStats();
    } catch (error) {
        table.innerHTML =
            '<tr><td colspan="7">Unable to load records. Check the backend.</td></tr>';
        message.textContent = error.message;
    }
}

function renderStudents() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = students.filter(student =>
        student.rollNo.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        table.innerHTML =
            '<tr><td colspan="7">No student records found.</td></tr>';
        return;
    }

    table.innerHTML = filtered.map(student => {
        const total = student.subject1 + student.subject2
            + student.subject3 + student.subject4 + student.subject5;

        const percentage = total / 5;
        const grade = getGrade(percentage);
        const passed = isPassed(student);

        return `
            <tr>
                <td>${escapeHTML(student.rollNo)}</td>
                <td>${escapeHTML(student.name)}</td>
                <td>${total}/500</td>
                <td>${percentage.toFixed(1)}%</td>
                <td class="grade">${grade}</td>
                <td class="${passed ? "status-pass" : "status-fail"}">
                    ${passed ? "Pass" : "Fail"}
                </td>
                <td>
                    <button class="delete-btn"
                        data-roll="${encodeURIComponent(student.rollNo)}">
                        Delete
                    </button>
                </td>
            </tr>`;
    }).join("");
}

function updateStats() {
    const total = students.length;
    const passed = students.filter(isPassed).length;

    const average = total
        ? students.reduce((sum, student) => sum +
            student.subject1 + student.subject2 + student.subject3 +
            student.subject4 + student.subject5, 0) / (total * 5)
        : 0;

    document.getElementById("totalStudents").textContent = total;
    document.getElementById("passedStudents").textContent = passed;
    document.getElementById("failedStudents").textContent = total - passed;
    document.getElementById("classAverage").textContent =
        average.toFixed(1) + "%";
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const student = {
        rollNo: document.getElementById("rollNo").value.trim(),
        name: document.getElementById("name").value.trim()
    };

    for (let i = 1; i <= 5; i++) {
        student["subject" + i] =
            Number(document.getElementById("subject" + i).value);
    }

    if (Object.values({
        s1: student.subject1,
        s2: student.subject2,
        s3: student.subject3,
        s4: student.subject4,
        s5: student.subject5
    }).some(mark => !Number.isInteger(mark) || mark < 0 || mark > 100)) {
        message.textContent = "Enter whole-number marks from 0 to 100.";
        return;
    }

    const button = document.getElementById("submitBtn");
    button.disabled = true;
    message.textContent = "Saving student...";

    try {
        const response = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Could not save student.");
        }

        form.reset();
        message.textContent = "Student added successfully!";
        await loadStudents();
    } catch (error) {
        message.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});

searchInput.addEventListener("input", renderStudents);

table.addEventListener("click", async event => {
    const button = event.target.closest(".delete-btn");
    if (!button) return;

    const rollNo = decodeURIComponent(button.dataset.roll);

    if (!confirm(`Delete student ${rollNo}?`)) return;

    try {
        const response = await fetch(
            API + "/" + encodeURIComponent(rollNo),
            { method: "DELETE" }
        );

        if (!response.ok) {
            throw new Error("Could not delete student.");
        }

        message.textContent = "Student deleted successfully.";
        await loadStudents();
    } catch (error) {
        message.textContent = error.message;
    }
});

loadStudents();
