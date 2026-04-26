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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0.5rem 0 1.25rem' }}>
          <div style={{
            border: '2px solid #ffd700',
            borderRadius: '8px',
            padding: '0.5rem 1.25rem',
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            background: 'rgba(255,215,0,0.06)',
            color: '#ffd700',
          }}>
            {session.id}
          </div>
          <button
            onClick={copyCode}
            title="Kopioi pelitunnus"
            style={{
              background: 'transparent',
              border: '2px solid rgba(255,215,0,0.4)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#ffd700',
              lineHeight: 1,
              fontFamily: 'inherit',
              fontWeight: 600,
            }}
          >
            {copied ? '🌟 Kopioitu!' : 'Kopioi pelitunnus'}
          </button>
        </div>

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
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
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
            <button className="button button-ghost" onClick={onLeave}>
              ← Takaisin (peli jää aktiiviseksi)
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
            <p>
              Odotetaan, että{' '}
              <strong>{session.players[session.createdBy]?.codename ?? 'isäntä'}</strong> aloittaa
              pelin…
            </p>
            <button className="button button-ghost" onClick={onLeave}>
              ← Takaisin (peli jää aktiiviseksi)
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
