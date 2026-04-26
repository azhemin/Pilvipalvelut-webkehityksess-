export type Player = {
  uid: string;
  codename: string;
  /** null instead of undefined – Firestore does not allow undefined values */
  guess: number | null;
  score: number;
};
