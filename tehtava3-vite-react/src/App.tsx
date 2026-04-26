import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, logout } from './authService.js';
import { useSession } from './hooks/useSession';
import {
  startGame,
  submitGuess,
  nextRound,
  endGame,
  cleanupOldSessions,
} from './services/gameSessionService';
import { fetchRandomProduct } from './services/productService';
import LoginForm from './LoginForm.jsx';
import { JoinOrCreate } from './components/JoinOrCreate';
import { SessionLobby } from './components/SessionLobby';
import { QuizForm } from './components/QuizForm';
import { RoundResult } from './components/RoundResult';
import { FinalScoreboard } from './components/FinalScoreboard';
import './App.css';

// ── Codename helpers (kept from original App.jsx) ─────────────────────────────
const NAMES = [
  'Kalle', 'Jussu', 'Pekka', 'Jorma', 'Seppo', 'Miika', 'Ismo', 'Heikki',
  'Juhani', 'Matti', 'Keijo', 'Risto', 'Jani', 'Antti', 'Timo', 'Vesa',
  'Tuomas', 'Lauri', 'Sami', 'Petri', 'Jukka', 'Hannu', 'Otto', 'Ville',
  'Aleksi', 'Mikko', 'Veikko', 'Paavo', 'Tapio', 'Leevi', 'Sakari', 'Olavi',
  'Onni', 'Ilkka', 'Erkki', 'Raimo', 'Pentti', 'Urho', 'Arvo', 'Väinö',
  'Eino', 'Toivo', 'Osmo', 'Reino', 'Aarne', 'Kalevi', 'Aimo', 'Taisto',
  'Veijo', 'Unto',
];
const ADJECTIVES = [
  'Hytkyvä', 'Paleleva', 'Kiittävä', 'Nopea', 'Riittoisa', 'Ahkera',
  'Utelias', 'Rohkea', 'Hiljainen', 'Riemukas', 'Väsymätön', 'Juureva',
  'Kuulas', 'Kepeä', 'Salaperäinen', 'Hurja', 'Vimmattu', 'Nokela',
  'Hiipivä', 'Hehkuva', 'Jäätävä', 'Tulinen', 'Tuulinen', 'Mahtaileva',
  'Viiltävä', 'Koominen', 'Kiukkuinen', 'Vauhdikas', 'Harkitseva', 'Häijy',
  'Suloinen', 'Rämäpäinen', 'Hämmästynyt', 'Turhamainen', 'Tarkkaavainen',
  'Loistava', 'Häilyvä', 'Omituinen', 'Tahmea', 'Kalpea', 'Hempeä',
  'Huimaava', 'Liukas', 'Rempseä', 'Kitsas', 'Värikäs', 'Uljas',
  'Sisukas', 'Tyyni', 'Pöyhistynyt',
];
const SUFFIXES = [
  '42', '99', '007', 'X7', 'Z3', '#1', '!!', 'X9', '#0', '77',
  '13', '88', '55', '66', '44', 'Z9', 'X1', '#7', '69', '21',
  'ZZ', 'XX', '##', '4X', '0Z', '!9', '#4', 'A1', 'B2', 'C3',
];

function generateCodename(): string {
  const n = NAMES[Math.floor(Math.random() * NAMES.length)];
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${a}${n}${s}`;
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [codename, setCodename] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // 5.2 – real-time listener
  const session = useSession(sessionId);

  // Persist sessionId so the user can return to their game after pressing "back"
  const saveSession = (id: string | null) => {
    if (id) localStorage.setItem('last_session', id);
    else localStorage.removeItem('last_session');
    setSessionId(id);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const key = `codename_${firebaseUser.uid}`;
        const cached = localStorage.getItem(key);
        const name = cached ?? generateCodename();
        if (!cached) localStorage.setItem(key, name);
        setCodename(name);
        // Restore last session if any
        const lastSession = localStorage.getItem('last_session');
        if (lastSession) setSessionId(lastSession);
        // Clean up old/finished sessions in background
        cleanupOldSessions().catch(console.error);
      } else {
        setCodename('');
        saveSession(null);
      }
    });
    return () => unsub();
  }, []);

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) return <LoginForm />;

  // ── Logged in, no session → lobby chooser ─────────────────────────────────
  if (!sessionId) {
    const lastSession = localStorage.getItem('last_session');
    return (
      <JoinOrCreate
        uid={user.uid}
        codename={codename}
        onSessionJoined={saveSession}
        lastSessionId={lastSession ?? undefined}
      />
    );
  }

  // ── Waiting for Firestore data ─────────────────────────────────────────────
  if (!session) {
    return (
      <main className="app">
        <section className="card">
          <p>Ladataan…</p>
          <button className="button button-ghost" onClick={() => saveSession(null)}>
            Takaisin
          </button>
        </section>
      </main>
    );
  }

  // ── 5.3 – Waiting room ────────────────────────────────────────────────────
  if (session.status === 'waiting') {
    return (
      <SessionLobby
        session={session}
        currentUserId={user.uid}
        onStartGame={async () => {
          const product = await fetchRandomProduct();
          await startGame(session.id, product);
        }}
        onLeave={() => setSessionId(null)}
      />
    );
  }

  // ── 5.3 – Playing ─────────────────────────────────────────────────────────
  if (session.status === 'playing') {
    // Round resolved – show results to everyone
    if (session.roundResolved) {
      return (
        <RoundResult
          session={session}
          currentUserId={user.uid}
          onNextRound={async () => {
            const product = await fetchRandomProduct();
            await nextRound(session.id, session.currentRound, session.maxRounds, product);
          }}
          onEndGame={async () => {
            await endGame(session.id);
          }}
        />
      );
    }

    // 5.2 – QuizForm (guessing phase)
    return (
      <QuizForm
        session={session}
        currentUserId={user.uid}
        currentUserCodename={codename}
        onSubmitGuess={(guess) => submitGuess(session.id, user.uid, guess)}
      />
    );
  }

  // ── 5.3 – Finished ────────────────────────────────────────────────────────
  if (session.status === 'finished') {
    return (
      <FinalScoreboard
        session={session}
        currentUserId={user.uid}
        onNewGame={() => saveSession(null)}
      />
    );
  }

  return null;
}

export default App;
