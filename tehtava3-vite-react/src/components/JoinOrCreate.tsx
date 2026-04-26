import { useState } from 'react';
import { createSession, joinSession } from '../services/gameSessionService';
import { logout } from '../authService';

interface JoinOrCreateProps {
  uid: string;
  codename: string;
  onSessionJoined: (sessionId: string) => void;
  lastSessionId?: string;
}

export function JoinOrCreate({ uid, codename, onSessionJoined, lastSessionId }: JoinOrCreateProps) {
  const [sessionName, setSessionName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const withLoading = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Aikakatkaisu – onko Firestore käytössä Firebase-konsolissa?')), 10000),
      );
      await Promise.race([fn(), timeout]);
    } catch (e) {
      console.error('[JoinOrCreate]', e);
      setError(e instanceof Error ? e.message : 'Tuntematon virhe');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () =>
    withLoading(async () => {
      if (!sessionName.trim()) throw new Error('Anna pelin nimi');
      const session = await createSession(sessionName.trim(), uid, codename);
      onSessionJoined(session.id);
    });

  const handleJoin = () =>
    withLoading(async () => {
      if (!joinCode.trim()) throw new Error('Anna pelitunnus');
      const code = joinCode.trim().toUpperCase();
      await joinSession(code, uid, codename);
      onSessionJoined(code);
    });

  return (
    <main className="app">
      <section className="card">
        <h1 style={{ textAlign: 'center' }}>Hintavisa</h1>
        <p className="lead">
          Pelaajana: <strong>{codename}</strong>
        </p>

        <div className="game-section">
          <h2>Luo uusi peli</h2>
          <input
            className="login-input"
            type="text"
            placeholder="Pelin nimi"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            disabled={loading}
          />
          <button className="button button-primary" onClick={handleCreate} disabled={loading}>
            {loading ? 'Luodaan...' : 'Luo peli'}
          </button>
        </div>

        <div className="game-section">
          <h2>Liity peliin</h2>
          <input
            className="login-input"
            type="text"
            placeholder="Pelitunnus (esim. ABC123)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            disabled={loading}
          />
          <button className="button button-primary" onClick={handleJoin} disabled={loading}>
            {loading ? 'Liitytään...' : 'Liity peliin'}
          </button>
        </div>

        {error && <p className="login-error">{error}</p>}

        {lastSessionId && (
          <div className="game-section" style={{ borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>Sinulla on kesken oleva peli:</p>
            <button
              className="button button-primary"
              style={{ background: '#2563eb' }}
              onClick={() => onSessionJoined(lastSessionId)}
              disabled={loading}
            >
              ▶ Jatka peliä ({lastSessionId})
            </button>
          </div>
        )}

        <button className="button button-ghost" onClick={logout} style={{ marginTop: '1rem' }}>
          Kirjaudu ulos
        </button>
      </section>
    </main>
  );
}
