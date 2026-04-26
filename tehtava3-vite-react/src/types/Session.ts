import type { Player } from './Player';

export type SessionStatus = 'waiting' | 'playing' | 'finished';

export type Session = {
  id: string;
  name: string;
  status: SessionStatus;
  createdBy: string;
  /** Firestore ServerTimestamp – typed as unknown to avoid import of FieldValue */
  createdAt: unknown;
  currentRound: number;
  maxRounds: number;
  /** Product name shown to players during guessing phase */
  productTitle: string | null;
  /** Product image URL */
  productThumbnail: string | null;
  /** Stored in Firestore but hidden from UI until roundResolved is true */
  correctPrice: number | null;
  /** Cumulative score per player uid */
  scores: Record<string, number>;
  /** Map of uid -> Player (including current guess) */
  players: Record<string, Player>;
  /** Set to true when all players have guessed in the current round */
  roundResolved: boolean;
  lastActivity: unknown;
};
