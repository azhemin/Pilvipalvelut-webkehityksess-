import { useState } from 'react';
import type { Session } from '../types/Session';

interface QuizFormProps {
  session: Session;
  currentUserId: string;
  currentUserCodename: string;
  onSubmitGuess: (guess: number) => Promise<void>;
}

export function QuizForm({ session, currentUserId, currentUserCodename, onSubmitGuess }: QuizFormProps) {
  const [guess, setGuess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const players = Object.values(session.players);
  const guessedCount = players.filter((p) => p.guess !== null).length;
  const myPlayer = session.players[currentUserId];

  // Waiting screen shown after the player has already submitted
  if (myPlayer?.guess !== null && myPlayer?.guess !== undefined) {
    return (
      <main className="app">
        <section className="card">
          <h2>
            Kierros {session.currentRound}/{session.maxRounds}
          </h2>
          <p>
            Tuote: <strong>{session.productTitle}</strong>
          </p>
          <p className="lead">
            Arvauksesi: <strong>{myPlayer.guess} €</strong>
          </p>
          <p>
            Odotetaan muita… ({guessedCount}/{players.length} arvannut)
          </p>
          <ul className="player-list">
            {players.map((p) => (
              <li key={p.uid} className="player-item">
                {p.codename}: {p.guess !== null ? '✅' : '⏳'}
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(guess);
    if (!isFinite(num) || num <= 0) {
      setError('Anna kelvollinen hinta (> 0)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmitGuess(Math.round(num * 100) / 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Virhe arvausta lähettäessä');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app">
      <section className="card">
        <h2>
          Kierros {session.currentRound}/{session.maxRounds}
        </h2>

        {session.productThumbnail && (
          <img
            src={session.productThumbnail}
            alt={session.productTitle ?? ''}
            className="product-thumbnail"
          />
        )}

        <h3 style={{ marginBottom: '0.25rem' }}>{session.productTitle}</h3>
        <p className="lead">Kuinka paljon tämä maksaa? Arvaa hinta!</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
          <input
            className="login-input"
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Arvaa hinta (€)"
            min="0.01"
            step="0.01"
            required
            disabled={loading}
          />
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? 'Lähetetään…' : `Arvaa, ${currentUserCodename}`}
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}

        <p style={{ marginTop: '1rem', opacity: 0.6 }}>
          {guessedCount}/{players.length} pelaajaa arvannut
        </p>
      </section>
    </main>
  );
}
