import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, getAuthToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  const token = getAuthToken();
  if (!token) return null;
  if (!socket) {
    socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'], reconnectionAttempts: 10 });
  }
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}

