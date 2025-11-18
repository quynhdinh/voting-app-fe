import React from 'react';

export default function ContestView({ contest, onVote, onBack }) {
  const sorted = [...contest.candidates].sort((a, b) => b.votes - a.votes);

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: 12 }}>
        Back to contests
      </button>

      <h2>{contest.title}</h2>
      {contest.description && <p style={{ color: '#333' }}>{contest.description}</p>}
      <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
        <div>Start: {contest.startTime ? new Date(contest.startTime).toLocaleString() : 'TBD'}</div>
        <div>End: {contest.endTime ? new Date(contest.endTime).toLocaleString() : 'TBD'}</div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3>Vote</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {contest.candidates.map((cand) => (
              <li key={cand.id} style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{cand.name}</strong>
                    {cand.description && <div style={{ fontSize: 13, color: '#444' }}>{cand.description}</div>}
                  </div>
                  <div>
                    <button onClick={() => onVote(cand.id)}>Vote</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ width: 320 }}>
          <h3>Results</h3>
          <ol>
            {sorted.map((s) => (
              <li key={s.id} style={{ marginBottom: 6 }}>
                {s.name} — {s.votes} vote{s.votes !== 1 ? 's' : ''}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
