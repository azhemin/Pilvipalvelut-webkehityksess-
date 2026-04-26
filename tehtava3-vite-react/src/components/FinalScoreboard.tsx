import type { Session } from '../types/Session';

interface FinalScoreboardProps {
  session: Session;
  currentUserId: string;
  onNewGame: () => void;
}

export function FinalScoreboard({ session, currentUserId, onNewGame }: FinalScoreboardProps) {
  const sorted = Object.values(session.players).sort(
    (a, b) => (session.scores[b.uid] ?? 0) - (session.scores[a.uid] ?? 0),
  );
  const winner = sorted[0];

  return (
    <main className="app">
      <section className="card">
        <h1>Peli päättyi! 🎉</h1>

        {winner && (
          <div className="winner-banner">
            <p>
              🏆 Voittaja: <strong>{winner.codename}</strong>
            </p>
            <p>{session.scores[winner.uid] ?? 0} pistettä</p>
          </div>
        )}

        <h2>Lopputulokset</h2>
        <ol className="result-list" style={{ paddingLeft: 0 }}>
          {sorted.map((p, i) => (
            <li key={p.uid} className={`result-item${i === 0 ? ' winner' : ''}`}>
              <span>
                {i + 1}. {p.codename}
                {p.uid === currentUserId ? ' (sinä)' : ''}
              </span>
              <span>{session.scores[p.uid] ?? 0} pistettä</span>
            </li>
          ))}
        </ol>

        <button className="button button-primary" onClick={onNewGame}>
          Uusi peli
        </button>
      </section>
    </main>
  );
}
