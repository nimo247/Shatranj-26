import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  if (!socket && token) {
    socket = io({ auth: { token } });
    
    socket.on('connect', () => console.log('[Socket] Connected:', socket?.id));
    socket.on('disconnect', () => console.log('[Socket] Disconnected'));
    socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));
  } else if (!socket) {
    throw new Error('Socket not initialized and no token provided to initialize it.');
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
