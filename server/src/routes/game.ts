import { Router, Response } from 'express';
import { prisma } from '../lib/db';
import { getIO } from '../lib/socket';
import { currentGameState, setGameState, setSessionLastBackupTime, sessionLastBackupTime } from '../lib/state';
import { broadcastLedger } from '../engine/socketEngine';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { ADMIN_KEYWORD } from '../config';

const router = Router();

router.get('/state', (req, res) => {
  res.json({ state: currentGameState });
});

router.post('/state', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { state } = req.body;
  const io = getIO();
  if (!['NOT_STARTED', 'RUNNING', 'PAUSED', 'ENDED'].includes(state)) {
    return res.status(400).json({ error: 'Invalid game state' });
  }

  await prisma.gameConfig.upsert({
    where: { id: 1 },
    update: { state },
    create: { id: 1, state }
  });
  setGameState(state);

  if (state === 'NOT_STARTED') {
    setSessionLastBackupTime(null);
    io.emit('backup_update', { lastBackup: null, active: false });

    await prisma.$transaction(async (tx) => {
      await tx.mail.deleteMany({});
      await tx.order.deleteMany({});
      await tx.team.deleteMany({ where: { role: 'TEAM' } });
      await tx.card.updateMany({ 
        data: { isBuilt: false, isActive: false, isDisabled: false, teamId: null } 
      });
      await tx.roundSnapshot.deleteMany({});
      await tx.activeDebuff.deleteMany({});
      await tx.disasterLog.deleteMany({});

      const admin = await tx.team.upsert({
        where: { teamId: 'ADMIN' },
        update: {
          food: 999999,
          material: 999999,
          gold: 999999,
          escrowFood: 0,
          escrowMaterial: 0,
          escrowGold: 0
        },
        create: {
          teamId: 'ADMIN',
          teamName: 'The Imperial Citadel (Admin)',
          region: 'Central High Plateau',
          password: ADMIN_KEYWORD,
          role: 'ADMIN',
          food: 999999,
          material: 999999,
          gold: 999999
        }
      });

      await tx.order.createMany({
        data: [
          { creatorId: admin.id, resourceType: 'FOOD', orderType: 'BUY', amount: 999999, price: 1, isAdminOrder: true, status: 'OPEN' },
          { creatorId: admin.id, resourceType: 'FOOD', orderType: 'SELL', amount: 999999, price: 2, isAdminOrder: true, status: 'OPEN' },
          { creatorId: admin.id, resourceType: 'MATERIAL', orderType: 'BUY', amount: 999999, price: 1, isAdminOrder: true, status: 'OPEN' },
          { creatorId: admin.id, resourceType: 'MATERIAL', orderType: 'SELL', amount: 999999, price: 2, isAdminOrder: true, status: 'OPEN' },
        ]
      });
    });
  } else {
    io.emit('backup_update', { lastBackup: sessionLastBackupTime, active: state === 'RUNNING' });
  }

  io.emit('game_state_update', state);
  broadcastLedger(io);
  io.emit('admin_refresh');
  res.json({ state });
});

export default router;
