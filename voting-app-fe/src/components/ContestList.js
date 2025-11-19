import React from 'react';

export default function ContestList({ contests, onSelect, onOpen }) {
  if (!contests || !contests.length) return <p>No contests yet.</p>;

  return (
    <div>
      <h2>Contests</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {contests.map((c) => {
          const start = c.startTime ? new Date(c.startTime).toLocaleString() : 'TBD';
          const end = c.endTime ? new Date(c.endTime).toLocaleString() : 'TBD';
          return (
            <li key={c.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{c.title}</strong>
                  <div style={{ fontSize: 12, color: '#666' }}>Starts: {start} • Ends: {end}</div>
                </div>
                <div>
                  <button onClick={() => onOpen ? onOpen(c) : onSelect(c.id)}>View / Vote</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
