import React from 'react';

function PlayerStats() {
  return (
    <section className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-semibold mb-3">Top Performers</h2>
      <ul className="list-disc list-inside">
        <li>Player X: 45 runs off 30 balls</li>
        <li>Player Y: 3 wickets for 28 runs</li>
      </ul>
    </section>
  );
}

export default PlayerStats;