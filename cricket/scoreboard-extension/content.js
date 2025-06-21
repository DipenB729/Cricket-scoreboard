// Create the overlay div
const overlay = document.createElement('div');
overlay.id = 'scoreboard-overlay';
overlay.innerHTML = `
  <table>
    <thead>
      <tr>
        <th>Team</th>
        <th>Player 1</th>
        <th>Player 2</th>
        <th>Score</th>
        <th>Decision</th>
      </tr>
    </thead>
    <tbody id="scoreboard-body">
      <tr><td colspan="5">Waiting for data...</td></tr>
    </tbody>
  </table>
`;
document.body.appendChild(overlay);

// Fetch and update the scoreboard every few seconds
async function updateScoreboard() {
  try {
    const res = await fetch('http://127.0.0.1:8000/live-scoreboard');
    const data = await res.json();

    const tbody = document.getElementById('scoreboard-body');
    tbody.innerHTML = '';

    if (data.length > 0) {
      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.team}</td>
          <td>${row.player1}</td>
          <td>${row.player2}</td>
          <td>${row.score}</td>
          <td>${row.decision}</td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5">No data</td></tr>`;
    }
  } catch (err) {
    console.error('Failed to update scoreboard', err);
  }
}

// Update every 2 seconds
setInterval(updateScoreboard, 2000);
