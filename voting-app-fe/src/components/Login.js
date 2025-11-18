import React, { useState } from 'react';

export default function Login({ currentUser, onLogin, onLogout }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (currentUser) {
    return (
      <div>
        <span style={{ marginRight: 8 }}>{`Hi, ${currentUser.username || currentUser.name}`}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    );
  }

  async function submit() {
    setError('');
    if (!username.trim() || !password) return setError('Enter username and password');
    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append('username', username.trim());
      body.append('password', password);

      const res = await fetch('http://localhost:8080/users/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        // ignore parse error
      }

      // Accept success if server responds with JSON.message === 'success'
      if (data && data.message === 'success') {
        const user = { id: data.id || String(Date.now()), username: data.username || username.trim() };
        onLogin(user);
        setUsername('');
        setPassword('');
        setError('');
      } else {
        setError('Unauthorized — check credentials');
      }
    } catch (e) {
      setError('Network error — could not reach auth endpoint');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ marginRight: 8 }} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginRight: 8 }} />
      <button onClick={submit} disabled={loading}>
        {loading ? 'Signing in...' : 'Login'}
      </button>
      {error && <div style={{ color: 'crimson', marginTop: 6 }}>{error}</div>}
    </div>
  );
}
