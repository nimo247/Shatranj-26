import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';
import { currentGameState, activeTeamSockets } from '../lib/state';
import { handleCreateOrder, handleAcceptOrder, handleInteractAdminOrder, handleCancelOrder } from './orderEngine';
import { JWT_SECRET } from '../config';

export function setupSocketEngine(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return next(new Error('Authentication error'));
      socket.data.user = decoded;
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user; 
    console.log(`Socket connected: ${user.teamId}`);

    if (user.role !== 'ADMIN') {
      const existingSocket = activeTeamSockets.get(user.id);
      if (existingSocket) {
        existingSocket.emit('auth_error', 'Logged in from another location. You have been disconnected.');
        existingSocket.disconnect(true);
      }
      activeTeamSockets.set(user.id, socket);

      socket.on('disconnect', () => {
        if (activeTeamSockets.get(user.id) === socket) {
          activeTeamSockets.delete(user.id);
        }
      });
    }

    socket.join(`team_${user.id}`);
    
    if (user.role === 'ADMIN') {
      socket.join('admins');
    }

    socket.emit('game_state_update', currentGameState);
    broadcastLedger(io);
    
    if (user.role !== 'ADMIN') {
      prisma.team.findUnique({
        where: { id: user.id },
        include: { mails: { orderBy: { createdAt: 'desc' }, take: 10 } }
      }).then(team => {
        if (team) {
          socket.emit('team_hud_update', team);
        } else {
          socket.emit('auth_error', 'Your session has expired. Please log in again.');
        }
      }).catch(console.error);
    }

    socket.on('create_order', (data) => handleCreateOrder(io, socket, user, data));
    socket.on('accept_order', (orderId) => handleAcceptOrder(io, socket, user, orderId));
    socket.on('interact_admin_order', (payload) => handleInteractAdminOrder(io, socket, user, payload));
    socket.on('cancel_order', (orderId) => handleCancelOrder(io, socket, user, orderId));

    socket.on('mark_mails_read', async () => {
      await prisma.mail.updateMany({
        where: { teamId: user.id, isRead: false },
        data: { isRead: true }
      });
      sendTeamUpdate(io, user.id);
    });
  });
}

export async function broadcastLedger(io: Server) {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { status: 'OPEN' },
        { isAdminOrder: true }
      ]
    },
    include: { 
      creator: { select: { teamName: true, region: true, role: true } },
      target: { select: { teamName: true } }
    },
    orderBy: [
      { isAdminOrder: 'desc' },
      { createdAt: 'desc' }
    ]
  });
  io.emit('ledger_update', orders);
}

export async function sendTeamUpdate(io: Server, teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { 
      mails: { 
        orderBy: { createdAt: 'desc' },
        take: 10 
      } 
    }
  });
  if (team) {
    io.to(`team_${team.id}`).emit('team_hud_update', team);
    io.to('admins').emit('admin_refresh');
  }
}
