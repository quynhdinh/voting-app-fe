import React, { useEffect, useState } from 'react';
import './App.css';
import { initialContests } from './data/dummy';
import Login from './components/Login';
import CreateContest from './components/CreateContest';
import Modal from './components/Modal';
import ContestList from './components/ContestList';
import ContestView from './components/ContestView';

const CONTESTS_KEY = 'voting_app_contests_v1';
const USER_KEY = 'voting_app_user_v1';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [contests, setContests] = useState([]);
  const [selectedContestId, setSelectedContestId] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const rawUser = localStorage.getItem(USER_KEY);
    if (rawUser) {
      try {
        setCurrentUser(JSON.parse(rawUser));
      } catch {}
    }

    const raw = localStorage.getItem(CONTESTS_KEY);
    if (raw) {
      try {
        setContests(JSON.parse(raw));
        return;
      } catch {}
    }
    setContests(initialContests);
  }, []);

  // fetch contests from server (gateway) on mount and replace local list if successful
  useEffect(() => {
    async function loadContests() {
      try {
        const res = await fetch('http://localhost:8080/contests');
        if (!res.ok) {
          console.warn('Could not fetch contests from server, status', res.status);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) return;
        // map server contests to local shape (no candidates yet)
        const mapped = data.map((s) => ({
          id: s.id != null ? String(s.id) : `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          title: s.title,
          description: s.description || '',
          // server startTime/endTime are epoch seconds
          startTime: typeof s.startTime === 'number' ? new Date(s.startTime * 1000).toISOString() : s.startTime,
          endTime: typeof s.endTime === 'number' ? new Date(s.endTime * 1000).toISOString() : s.endTime,
          createdBy: s.createdBy,
          createdAt: s.createdAt != null ? (typeof s.createdAt === 'number' ? new Date(s.createdAt).toISOString() : s.createdAt) : undefined,
          // candidates will be loaded when viewing the contest; for now leave undefined
        }));
        setContests(mapped);
      } catch (e) {
        console.warn('Failed to load contests from server', e);
      }
    }

    loadContests();
  }, []);

  useEffect(() => {
    localStorage.setItem(CONTESTS_KEY, JSON.stringify(contests));
  }, [contests]);

  useEffect(() => {
    if (currentUser) localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    else localStorage.removeItem(USER_KEY);
  }, [currentUser]);

  function handleLogin(userOrCreds) {
    // If passed an object from server (with id/username), use it; otherwise normalize
    if (userOrCreds && (userOrCreds.id || userOrCreds.username)) {
      const u = { id: userOrCreds.id || String(Date.now()), username: userOrCreds.username || userOrCreds.name };
      setCurrentUser(u);
      return;
    }
    // fallback: if old flow sends creds, create a simple user
    if (userOrCreds && userOrCreds.username) {
      setCurrentUser({ id: String(Date.now()), username: userOrCreds.username });
    }
  }

  function handleLogout() {
    setCurrentUser(null);
  }

  async function handleCreateContest(payload) {
    console.log("currentUser " + JSON.stringify(currentUser));
    console.log(currentUser.id);
    console.log()
    // Try to create on server first. If server is unreachable or returns error,
    // fall back to local-only creation so the UX remains functional.
    const localId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const makeLocalContest = (candidates) => ({
      id: localId,
      title: payload.title,
      description: payload.description,
      startTime: payload.startTime,
      endTime: payload.endTime,
      candidates,
    });

    const normalizedCandidates = payload.candidates
      ? payload.candidates.map((c, i) => ({ id: c.id || String(i + 1), name: c.name, description: c.description || '', votes: c.votes || 0 }))
      : Array.from({ length: 10 }).map((_, i) => ({ id: String(i + 1), name: `Candidate ${i + 1}`, description: '', votes: 0 }));

    // Prepare body for server: createdBy as number (required by API), start/end as epoch seconds
    // We expect the API shape exactly like the sample request.
    const createdBy = currentUser && currentUser.id ? Number(currentUser.id) : 1;
    const startEpoch = payload.startTime ? Math.floor(new Date(payload.startTime).getTime() / 1000) : undefined;
    const endEpoch = payload.endTime ? Math.floor(new Date(payload.endTime).getTime() / 1000) : undefined;

    console.log('createdBy ', createdBy);
    const serverBody = {
      createdBy: createdBy,
      title: payload.title,
      description: payload.description || '',
      startTime: startEpoch || null,
      endTime: endEpoch || null,
      candidates: (payload.candidates || normalizedCandidates).map((c) => ({ name: c.name, description: c.description || '' })),
    };
    // console.log('JSON.stringify(serverBody)', JSON.stringify(serverBody));
    try {
      const res = await fetch('http://localhost:8080/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverBody),
      });
      console.log('JSON.stringify(serverBody)', JSON.stringify(serverBody));
      if (res.ok) {
        // Parse returned contest if provided
        console.log("res.ok")
        let data = null;
        try {
          data = await res.json();
          console.log('data', data);
        } catch (e) {
          console.log('Could not parse server response as JSON');
          // ignore
        }

        if (data && (data.id || data.title)) {
          // Server created contest — normalize to our local shape.
          const serverContest = {
            id: data.id || localId,
            title: data.title || payload.title,
            description: data.description || payload.description || '',
            // server returns epoch seconds for startTime/endTime per API
            startTime: typeof data.startTime === 'number' ? new Date(data.startTime * 1000).toISOString() : data.startTime || payload.startTime,
            endTime: typeof data.endTime === 'number' ? new Date(data.endTime * 1000).toISOString() : data.endTime || payload.endTime,
            createdBy: data.createdBy,
            createdAt: data.createdAt ? (typeof data.createdAt === 'number' ? new Date(data.createdAt).toISOString() : data.createdAt) : undefined,
            candidates: (payload.candidates || normalizedCandidates).map((c, i) => ({ id: c.id || String(i + 1), name: c.name, description: c.description || '', votes: 0 })),
          };
          setContests((c) => [serverContest, ...c]);
          setCreating(false);
          return;
        }
      }

      // If server responded but didn't return useful data or returned error, fall back to local
      alert('Server did not create contest — saving locally');
    } catch (e) {
      // network or other error
      console.warn('Could not reach server to create contest:', e);
      alert('Could not reach server, contest saved locally');
    }

    // fallback local creation
  const newContest = makeLocalContest(normalizedCandidates);
  setContests((c) => [newContest, ...c]);
  setCreating(false);
  }

  function handleSelectContest(id) {
    setSelectedContestId(id);
  }

  async function handleOpenContest(c) {
    // c may be contest metadata from list; fetch full details from gateway
    try {
      const res = await fetch(`http://localhost:8080/contests/${c.id}`);
      if (!res.ok) {
        console.warn('Could not fetch contest details, status', res.status);
        // fallback: show metadata only
        setModalContest(c);
        return;
      }
      const data = await res.json();
      // data expected shape: { contest: {...}, candidates: [...] }
      const cont = data.contest || data;
      const candidates = data.candidates || [];
      const modalObj = {
        id: cont.id != null ? String(cont.id) : c.id,
        title: cont.title,
        description: cont.description || '',
        startTime: cont.startTime, // epoch seconds
        endTime: cont.endTime,
        createdBy: cont.createdBy,
        createdAt: cont.createdAt,
        candidates,
      };
      setModalContest(modalObj);
    } catch (e) {
      console.warn('Failed to load contest details', e);
      setModalContest(c);
    }
  }

  async function handleVoteCandidate(contestId, candidateId) {
    // Send vote to gateway as JSON { contestId, voterId, candidateId }
    // On success: refresh contest details (calls the same endpoint used when opening a contest)
    // On failure: fall back to a local increment (localVotes) so the UX remains responsive
    console.log('Voting for candidate', candidateId, 'in contest', contestId);
    const voterId = currentUser && currentUser.id ? Number(currentUser.id) : null;

    const body = {
      contestId: isNaN(Number(contestId)) ? contestId : Number(contestId),
      voterId: isNaN(Number(voterId)) ? voterId : Number(voterId),
      candidateId: isNaN(Number(candidateId)) ? candidateId : Number(candidateId),
    };
    // console.log(JSON.stringify(body));
    try {
      const res = await fetch('http://localhost:8080/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // If the server accepts the vote, refresh the contest details to show updated counts
        // Reuse the existing fetch logic by calling handleOpenContest with an id-only object
        try {
          await handleOpenContest({ id: contestId });
        } catch (e) {
          // If refreshing fails, still try to apply a local increment so user sees immediate feedback
          console.warn('Vote recorded but failed to refresh contest details', e);
          setModalContest((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              candidates: (prev.candidates || []).map((c) => (String(c.id) === String(candidateId) ? { ...c, localVotes: (c.localVotes || 0) + 1 } : c)),
            };
          });
        }
        return;
      }

      // Non-OK response -> fallback to local increment
      console.warn('Vote request failed, status', res.status);
      alert('Could not record vote on server — applying locally');
    } catch (e) {
      console.warn('Failed to send vote to server', e);
      alert('Could not reach server to record vote — applying locally');
    }

    // Fallback: increment a local vote counter on the modal and on the contests list if present
    setModalContest((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        candidates: (prev.candidates || []).map((c) => (String(c.id) === String(candidateId) ? { ...c, localVotes: (c.localVotes || 0) + 1 } : c)),
      };
    });

    setContests((prev) =>
      prev.map((ct) => {
        if (String(ct.id) !== String(contestId)) return ct;
        const oldCandidates = ct.candidates || [];
        return { ...ct, candidates: oldCandidates.map((c) => (String(c.id) === String(candidateId) ? { ...c, localVotes: (c.localVotes || 0) + 1 } : c)) };
      })
    );
  }

  function handleVote(contestId, candidateId) {
    setContests((prev) =>
      prev.map((ct) => {
        if (ct.id !== contestId) return ct;
        return { ...ct, candidates: ct.candidates.map((cand) => (cand.id === candidateId ? { ...cand, votes: cand.votes + 1 } : cand)) };
      })
    );
  }

  function handleBackToList() {
    setSelectedContestId(null);
  }

  const selectedContest = contests.find((c) => c.id === selectedContestId) || null;
  const [modalContest, setModalContest] = useState(null);
  const [modalResults, setModalResults] = useState(null);

  async function handleViewResults(contestId) {
    if (!contestId) return;
    try {
      const res = await fetch(`http://localhost:8080/results/${encodeURIComponent(contestId)}`);
      if (!res.ok) {
        console.warn('Could not fetch results, status', res.status);
        alert('Could not fetch results from server');
        return;
      }
      const data = await res.json();
      setModalResults(data);
    } catch (e) {
      console.warn('Failed to load results', e);
      alert('Failed to load results from server');
    }
  }

  return (
    <div className="App" style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Voting App</h1>
        <div>
          <Login currentUser={currentUser} onLogin={handleLogin} onLogout={handleLogout} />
        </div>
      </header>

      <main>
        {!currentUser && <p style={{ color: '#666' }}>Please login with any display name to vote or create contests.</p>}

        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setCreating(true)} disabled={!currentUser}>
            Create Contest (10 candidates)
          </button>
        </div>

        {creating && (
          <Modal onClose={() => setCreating(false)}>
            <CreateContest onCreate={handleCreateContest} onCancel={() => setCreating(false)} />
          </Modal>
        )}

        {!selectedContest && (
          <ContestList contests={contests} onSelect={handleSelectContest} onOpen={(c) => handleOpenContest(c)} />
        )}

        {selectedContest && <ContestView contest={selectedContest} onVote={(candidateId) => handleVote(selectedContest.id, candidateId)} onBack={handleBackToList} />}

        {modalContest && (
          <Modal onClose={() => setModalContest(null)}>
            <div>
              <h2>{modalContest.title}</h2>
              <p>{modalContest.description}</p>
              <div style={{ fontSize: 12, color: '#666' }}>
                <div>Start: {modalContest.startTime ? (typeof modalContest.startTime === 'number' ? new Date(modalContest.startTime * 1000).toLocaleString() : new Date(modalContest.startTime).toLocaleString()) : 'TBD'}</div>
                <div>End: {modalContest.endTime ? (typeof modalContest.endTime === 'number' ? new Date(modalContest.endTime * 1000).toLocaleString() : new Date(modalContest.endTime).toLocaleString()) : 'TBD'}</div>
                <div>Created by: {modalContest.createdBy || 'N/A'}</div>
                <div>Created at: {modalContest.createdAt ? (typeof modalContest.createdAt === 'number' ? new Date(modalContest.createdAt).toLocaleString() : new Date(modalContest.createdAt).toLocaleString()) : 'N/A'}</div>
              </div>

              <h3 style={{ marginTop: 12 }}>Candidates</h3>
              {modalResults ? (
                <div>
                  <h4>Results</h4>
                  <div style={{ fontSize: 13, color: '#333' }}>{modalResults.title || modalContest.title}</div>
                  <p style={{ fontSize: 13, color: '#555' }}>{modalResults.description}</p>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {(modalResults.candidateResults || []).map((r) => (
                      <li key={r.candidateId} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{r.name}</strong>
                            {r.description && <div style={{ fontSize: 13, color: '#444' }}>{r.description}</div>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 'bold' }}>{r.totalVotes}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {(modalContest.candidates || []).map((cand) => (
                    <li key={cand.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{cand.name}</strong>
                          {cand.description && <div style={{ fontSize: 13, color: '#444' }}>{cand.description}</div>}
                          {cand.localVotes ? <div style={{ fontSize: 12, color: '#666' }}>Local votes: {cand.localVotes}</div> : null}
                        </div>
                        <div>
                          <button onClick={() => handleVoteCandidate(modalContest.id, cand.id)}>Vote</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button onClick={() => handleViewResults(modalContest.id)} disabled={!!modalResults}>
                  View Results
                </button>
                {modalResults && (
                  <button
                    onClick={() => {
                      setModalResults(null);
                    }}
                  >
                    Clear Results
                  </button>
                )}
                <div style={{ marginLeft: 'auto' }}>
                  <button onClick={() => {
                    setModalResults(null);
                    setModalContest(null);
                  }}>Close</button>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}

export default App;
