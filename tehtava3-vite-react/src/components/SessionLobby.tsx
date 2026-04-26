import { useState } from 'react';
import type { Session } from '../types/Session';

interface SessionLobbyProps {
  session: Session;
  currentUserId: string;
  onStartGame: () => Promise<void>;
  onLeave: () => void;
}

export function SessionLobby({ session, currentUserId, onStartGame, onLeave }: SessionLobbyProps) {
  const players = Object.values(session.players);
  const isCreator = session.createdBy === currentUserId;
  const canStart = players.length >= 2;
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(session.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className="app">
      <section className="card">
        <h1>Odotetaan pelaajia…</h1>
        <p style={{ opacity: 0.7 }}>{session.name}</p>

        <p className="label">Pelitunnus – jaa tämä kavereille</p>
        <p className="codename">{session.id}</p>
        <button className="button button-ghost" onClick={copyCode} style={{ marginBottom: '1.25rem' }}>
          {copied ? '✅ Kopioitu!' : '📋 Kopioi pelitunnus'}
        </button>

        <h2>Pelaajat ({players.length}/4)</h2>
        <ul className="player-list">
          {players.map((p) => (
            <li key={p.uid} className="player-item">
              {p.codename}
              {p.uid === session.createdBy && ' 👑'}
              {p.uid === currentUserId && ' (sinä)'}
            </li>
          ))}
        </ul>

        {isCreator ? (
          <>
            {!canStart && (
              <p className="hint">Tarvitaan vähintään 2 pelaajaa ennen aloitusta.</p>
            )}
            <button
              className="button button-primary"
              onClick={onStartGame}
              disabled={!canStart}
            >
              Aloita peli ({players.length} pelaajaa)
            </button>
          </>
        ) : (
          <p>
            Odotetaan, että{' '}
            <strong>{session.players[session.createdBy]?.codename ?? 'isäntä'}</strong> aloittaa
            pelin…
          </p>
        )}

        <button className="button button-ghost" onClick={onLeave} style={{ marginTop: '1rem' }}>
          ← Takaisin (peli jää aktiiviseksi)
        </button>
      </section>
    </main>
  );
}
