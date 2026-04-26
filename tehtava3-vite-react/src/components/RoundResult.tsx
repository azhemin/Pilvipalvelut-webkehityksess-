import type { Session } from '../types/Session';
import type { Player } from '../types/Player';

interface RoundResultProps {
  session: Session;
  currentUserId: string;
  onNextRound: () => Promise<void>;
  onEndGame: () => Promise<void>;
}

/** Pure presentational component – no Firestore calls, no React state. */
export function RoundResult({ session, currentUserId, onNextRound, onEndGame }: RoundResultProps) {
  const isCreator = session.createdBy === currentUserId;
  const isLastRound = session.currentRound >= session.maxRounds;
  const correctPrice = session.correctPrice ?? 0;

  // Sort by closest guess (ascending difference)
  const sorted: Player[] = Object.values(session.players).sort((a, b) => {
    const diffA = Math.abs((a.guess ?? 0) - correctPrice);
    const diffB = Math.abs((b.guess ?? 0) - correctPrice);
    return diffA - diffB;
  });

  return (
    <main className="app">
      <section className="card">
        <h2>Kierros {session.currentRound} – tulos</h2>

        <div className="product-result">
          {session.productThumbnail && (
            <img
              src={session.productThumbnail}
              alt={session.productTitle ?? ''}
              className="product-thumbnail"
            />
          )}
          <p>{session.productTitle}</p>
          <p className="correct-price">
            Oikea hinta: <strong>{session.correctPrice} €</strong>
          </p>
        </div>

        <ul className="result-list">
          {sorted.map((p: Player, i: number) => (
            <li key={p.uid} className={`result-item${i === 0 ? ' winner' : ''}`}>
              <span>
                {i === 0 ? '🏆 ' : `${i + 1}. `}
                {p.codename}
                {p.uid === currentUserId ? ' (sinä)' : ''}
              </span>
              <span>arvaus: {p.guess ?? '–'} €</span>
              <span>ero: {Math.abs((p.guess ?? 0) - correctPrice).toFixed(2)} €</span>
              <span>pisteet: {session.scores[p.uid] ?? 0}</span>
            </li>
          ))}
        </ul>

        {isCreator ? (
          isLastRound ? (
            <button className="button button-primary" onClick={onEndGame}>
              Näytä loppupisteet
            </button>
          ) : (
            <button className="button button-primary" onClick={onNextRound}>
              Seuraava kierros ({session.currentRound + 1}/{session.maxRounds})
            </button>
          )
        ) : (
          <p>
            Odotetaan, että{' '}
            <strong>{session.players[session.createdBy]?.codename ?? 'isäntä'}</strong> jatkaa…
          </p>
        )}
      </section>
    </main>
  );
}
