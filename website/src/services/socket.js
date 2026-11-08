import { io } from 'socket.io-client';
import { SOCKET_URL, TOKEN_KEY } from './api';

let socket = null;

export function getSocket() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  if (!socket) {
    socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnectionAttempts: 10 });
  }
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

