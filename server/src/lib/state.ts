import { Socket } from 'socket.io';

export let currentGameState: 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED' = 'NOT_STARTED';
export let sessionLastBackupTime: string | null = null;
export const activeTeamSockets = new Map<string, Socket>();

export function setGameState(newState: 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED') {
  currentGameState = newState;
}

export function setSessionLastBackupTime(time: string | null) {
  sessionLastBackupTime = time;
}
