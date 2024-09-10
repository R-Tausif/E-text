function initializePoints() {
    if (localStorage.getItem("points") === null) {
        localStorage.setItem("points", 0);
    }
    updatePointsDisplay();
}

function updatePointsDisplay() {
    const points = localStorage.getItem("points");
    document.getElementById("points-display").innerText = `Points: ${points}`;
}
