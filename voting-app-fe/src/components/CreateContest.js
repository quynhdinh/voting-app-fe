import React, { useState } from 'react';

export default function CreateContest({ onCreate, onCancel }) {
  const [title, setTitle] = useState('New Contest');
  const [description, setDescription] = useState('Default contest description');
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(Math.floor(d.getMinutes() / 5) * 5);
    return d.toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date(Date.now() + 1000 * 60 * 60 * 24);
    d.setMinutes(Math.floor(d.getMinutes() / 5) * 5);
    return d.toISOString().slice(0, 16);
  });
  const [candidates, setCandidates] = useState(() =>
    // start with 2 candidates prefilled with default descriptions
    Array.from({ length: 2 }).map((_, i) => ({ name: `Candidate ${i + 1}`, description: 'Default candidate description' }))
  );

  const MAX_CANDIDATES = 10;

  function submit() {
    if (!title.trim()) return alert('Enter a title');
    if (!candidates.length) return alert('Add at least one candidate');
    const invalid = candidates.find((c) => !c.name || !c.name.trim());
    if (invalid) return alert('All candidates must have a name');
    const s = startTime ? new Date(startTime).toISOString() : undefined;
    const e = endTime ? new Date(endTime).toISOString() : undefined;
    if (s && e && new Date(s) >= new Date(e)) {
      alert('End time must be after start time');
      return;
    }

    // normalize candidates: give ids and votes
    const normalized = candidates.map((c, i) => ({ id: String(i + 1), name: c.name.trim(), description: c.description ? c.description.trim() : '', votes: 0 }));

    onCreate({ title: title.trim(), description: description.trim() || undefined, startTime: s, endTime: e, candidates: normalized });
  }

  function addCandidate() {
    setCandidates((cur) => {
      if (cur.length >= MAX_CANDIDATES) return cur;
      return [...cur, { name: `Candidate ${cur.length + 1}`, description: '' }];
    });
  }

  function removeCandidate(index) {
    setCandidates((cur) => cur.filter((_, i) => i !== index));
  }

  function updateCandidate(index, field, value) {
    setCandidates((cur) => cur.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
      <h3>Create contest (10 candidates)</h3>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>
          Title:
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginLeft: 8, width: '60%' }} />
        </label>

        <label style={{ display: 'block', marginBottom: 6 }}>
          Description:
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginLeft: 8, width: '60%', height: 60 }} />
        </label>

        <label style={{ display: 'block', marginBottom: 6 }}>
          Start time:
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ marginLeft: 8 }} />
        </label>

        <label style={{ display: 'block', marginBottom: 6 }}>
          End time:
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
      </div>
      <div style={{ marginTop: 12 }}>
        <h4>Candidates (up to 10)</h4>
        {candidates.map((cand, idx) => (
          <div key={idx} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <input
                  placeholder="Candidate name"
                  value={cand.name}
                  onChange={(e) => updateCandidate(idx, 'name', e.target.value)}
                  style={{ width: '100%', marginBottom: 6 }}
                />
                <textarea placeholder="Candidate description" value={cand.description} onChange={(e) => updateCandidate(idx, 'description', e.target.value)} style={{ width: '100%', height: 60 }} />
              </div>
              <div>
                <button onClick={() => removeCandidate(idx)} disabled={candidates.length <= 1}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
        <div style={{ marginBottom: 12 }}>
          <button onClick={addCandidate} disabled={candidates.length >= MAX_CANDIDATES} style={{ marginRight: 8 }}>
            Add candidate
          </button>
          <span style={{ color: '#666' }}>{candidates.length}/{MAX_CANDIDATES}</span>
        </div>

        <div>
          <button onClick={submit} style={{ marginRight: 8 }}>
            Create
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
