import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase.ts';
import type { Session } from '../types/Session';
import type { Player } from '../types/Player';
import type { Product } from '../types/Product';

const SESSIONS = 'sessions';

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// 5.2 – Game creation
// ─────────────────────────────────────────────────────────────
export async function createSession(
  name: string,
  creatorUid: string,
  creatorCodename: string,
  maxRounds = 3,
): Promise<Session> {
  const id = generateSessionId();
  const creatorPlayer: Player = {
    uid: creatorUid,
    codename: creatorCodename,
    guess: null,
    score: 0,
  };

  const data = {
    name,
    status: 'waiting',
    createdBy: creatorUid,
    createdAt: serverTimestamp(),
    currentRound: 0,
    maxRounds,
    productTitle: null,
    productThumbnail: null,
    correctPrice: null,
    scores: { [creatorUid]: 0 },
    players: { [creatorUid]: creatorPlayer },
    roundResolved: false,
    roundPlayerIds: [] as string[],
    lastActivity: serverTimestamp(),
  } as const;

  await setDoc(doc(db, SESSIONS, id), data);
  return { id, ...data } as unknown as Session;
}

// ─────────────────────────────────────────────────────────────
// 5.2 – Session fetching
// ─────────────────────────────────────────────────────────────
export async function getSession(sessionId: string): Promise<Session | null> {
  const snap = await getDoc(doc(db, SESSIONS, sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Session;
}

// ─────────────────────────────────────────────────────────────
// 5.3 – Join lobby
// ─────────────────────────────────────────────────────────────
export async function joinSession(
  sessionId: string,
  uid: string,
  codename: string,
): Promise<void> {
  const snap = await getDoc(doc(db, SESSIONS, sessionId));
  if (!snap.exists()) throw new Error('Sessiota ei löydy');

  const data = snap.data() as Session;
  if (data.status === 'finished') throw new Error('Peli on jo päättynyt');
  if (Object.keys(data.players).length >= 4) throw new Error('Sessio on täynnä (max 4 pelaajaa)');
  if (data.players[uid]) return; // already in session

  const player: Player = { uid, codename, guess: null, score: 0 };
  await updateDoc(doc(db, SESSIONS, sessionId), {
    [`players.${uid}`]: player,
    [`scores.${uid}`]: 0,
    lastActivity: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────
// 5.3 – Start game (waiting → playing)
// ─────────────────────────────────────────────────────────────
export async function startGame(sessionId: string, product: Product): Promise<void> {
  const snap = await getDoc(doc(db, SESSIONS, sessionId));
  if (!snap.exists()) throw new Error('Sessiota ei löydy');
  const data = snap.data() as Session;
  const roundPlayerIds = Object.keys(data.players);

  await updateDoc(doc(db, SESSIONS, sessionId), {
    status: 'playing',
    currentRound: 1,
    productTitle: product.title,
    productThumbnail: product.thumbnail,
    correctPrice: product.price,
    roundResolved: false,
    roundPlayerIds,
    lastActivity: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────
// 5.2 & 5.5 – Submit guess; auto-resolve when all players guessed
// ─────────────────────────────────────────────────────────────
export async function submitGuess(
  sessionId: string,
  uid: string,
  guess: number,
): Promise<void> {
  const ref = doc(db, SESSIONS, sessionId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Sessiota ei löydy');

    const data = snap.data() as Session;
    if (data.status !== 'playing') throw new Error('Peli ei ole käynnissä');
    if (data.roundResolved) throw new Error('Kierros on jo ratkaistu');

    // Merge the new guess
    const updatedPlayers: Record<string, Player> = {
      ...data.players,
      [uid]: { ...data.players[uid], guess },
    };

    // Only wait for players who were in the session when the round started
    const roundIds: string[] = data.roundPlayerIds ?? Object.keys(data.players);
    const allGuessed = roundIds.every((pid) => updatedPlayers[pid]?.guess !== null);

    const update: Record<string, unknown> = {
      [`players.${uid}.guess`]: guess,
      lastActivity: serverTimestamp(),
    };

    // 5.5 – Scoring: score += max(0, round(100 − |guess − price|))
    if (allGuessed && data.correctPrice !== null) {
      const correctPrice = data.correctPrice;
      const newScores: Record<string, number> = { ...data.scores };

      Object.entries(updatedPlayers).forEach(([pid, p]) => {
        const diff = Math.abs((p.guess as number) - correctPrice);
        const points = Math.max(0, Math.round(100 - diff));
        newScores[pid] = (newScores[pid] ?? 0) + points;
        update[`scores.${pid}`] = newScores[pid];
      });

      update.roundResolved = true;
    }

    tx.update(ref, update);
  });
}

// ─────────────────────────────────────────────────────────────
// 5.3 – Advance to next round (playing → playing or → finished)
// ─────────────────────────────────────────────────────────────
export async function nextRound(
  sessionId: string,
  currentRound: number,
  maxRounds: number,
  product: Product,
): Promise<void> {
  const ref = doc(db, SESSIONS, sessionId);

  if (currentRound >= maxRounds) {
    await updateDoc(ref, { status: 'finished', lastActivity: serverTimestamp() });
    return;
  }

  // Reset each player's guess for the new round
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Sessiota ei löydy');

  const data = snap.data() as Session;
  const resetPlayers: Record<string, Player> = {};
  Object.entries(data.players).forEach(([pid, p]) => {
    resetPlayers[pid] = { ...p, guess: null };
  });
  const roundPlayerIds = Object.keys(data.players);

  await updateDoc(ref, {
    currentRound: currentRound + 1,
    productTitle: product.title,
    productThumbnail: product.thumbnail,
    correctPrice: product.price,
    roundResolved: false,
    roundPlayerIds,
    players: resetPlayers,
    lastActivity: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────
// 5.3 – End the game immediately
// ─────────────────────────────────────────────────────────────
export async function endGame(sessionId: string): Promise<void> {
  await updateDoc(doc(db, SESSIONS, sessionId), {
    status: 'finished',
    lastActivity: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────
// 5.2 – Real-time listener (onSnapshot)
// ─────────────────────────────────────────────────────────────
export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void,
): () => void {
  return onSnapshot(doc(db, SESSIONS, sessionId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Session);
  });
}

// Keep the collection reference accessible if needed elsewhere
export { collection, db };
