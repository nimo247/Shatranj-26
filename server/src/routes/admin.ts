import { Router, Response } from 'express';
import { prisma } from '../lib/db';
import { getIO } from '../lib/socket';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { currentGameState, setGameState, setSessionLastBackupTime, sessionLastBackupTime } from '../lib/state';
import { broadcastLedger, sendTeamUpdate } from '../engine/socketEngine';
import { createBackupSnapshot, listAvailableSaves, restoreSaveSnapshot } from '../engine/backupWriter';

const router = Router();
router.use(authenticateAdmin);

export const REGION_PROFILES: Record<string, { food: number; material: number; gold: number }> = {
  'Eastern Granite Quarries': { food: 200, material: 800, gold: 500 },
  'Sinai Copper Mines': { food: 200, material: 800, gold: 500 },
  'Delta Basin': { food: 800, material: 200, gold: 500 },
  'Theban Floodplains': { food: 800, material: 200, gold: 500 },
  'Fayum Oasis': { food: 500, material: 500, gold: 500 },
  'Memphis Crossroads': { food: 500, material: 500, gold: 500 },
  'Red Sea Harbors': { food: 200, material: 500, gold: 800 },
  'Royal Necropolis': { food: 200, material: 500, gold: 800 },
  'Elephantine Outpost': { food: 800, material: 500, gold: 200 },
  'Nubian Cataracts': { food: 800, material: 500, gold: 200 },
};

router.get('/teams', async (req: AuthRequest, res: Response) => {
  const teams = await prisma.team.findMany({ where: { role: 'TEAM' } });
  res.json(teams);
});

router.post('/teams/bulk', async (req: AuthRequest, res: Response) => {
  const { teams } = req.body;
  try {
    for (const t of teams) {
      const profile = REGION_PROFILES[t.region] || { food: 500, material: 500, gold: 500 };
      await prisma.team.upsert({
        where: { teamId: t.teamId },
        update: {
          teamName: t.teamName,
          password: t.password,
        },
        create: {
          teamId: t.teamId,
          teamName: t.teamName,
          region: t.region,
          password: t.password,
          role: 'TEAM',
          food: profile.food,
          material: profile.material,
          gold: profile.gold,
        }
      });
    }
    res.json({ success: true });
    getIO().emit('admin_refresh');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/teams/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { food, material, gold, password } = req.body;
  try {
    const updateData: any = {};
    if (food !== undefined) updateData.food = Number(food);
    if (material !== undefined) updateData.material = Number(material);
    if (gold !== undefined) updateData.gold = Number(gold);
    if (password !== undefined) updateData.password = String(password);

    const updated = await prisma.team.update({
      where: { id },
      data: updateData
    });
    getIO().to(`team_${id}`).emit('team_hud_update', updated);
    getIO().emit('admin_refresh');
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/orders/imperial-rates', async (req: AuthRequest, res: Response) => {
  const { resourceType, orderType, price } = req.body;
  try {
    const updated = await prisma.order.updateMany({
      where: { isAdminOrder: true, resourceType, orderType },
      data: { price: Number(price) }
    });
    broadcastLedger(getIO());
    res.json({ success: true, count: updated.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/orders/imperial-trade/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const adminOrder = await prisma.order.findFirst({ where: { isAdminOrder: true } });
    if (!adminOrder) return res.status(404).json({ error: "Admin orders not found" });

    const newStatus = adminOrder.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    await prisma.order.updateMany({
      where: { isAdminOrder: true },
      data: { status: newStatus }
    });
    broadcastLedger(getIO());
    res.json({ success: true, newStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/orders/:id', async (req: AuthRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    let affectedCreatorId = null;

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Not found');
      
      if (order.status === 'OPEN' && !order.isAdminOrder) {
         affectedCreatorId = order.creatorId;
         if (order.orderType === 'SELL') {
            await tx.team.update({
              where: { id: order.creatorId },
              data: order.resourceType === 'FOOD' 
                ? { escrowFood: { decrement: order.amount } }
                : { escrowMaterial: { decrement: order.amount } }
            });
         } else {
            await tx.team.update({
              where: { id: order.creatorId },
              data: { escrowGold: { decrement: order.amount * order.price } }
            });
         }
      }
      await tx.order.delete({ where: { id: orderId } });
    });
    
    broadcastLedger(getIO());
    if (affectedCreatorId) {
      sendTeamUpdate(getIO(), affectedCreatorId);
    }
    getIO().emit('admin_refresh');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/game/backup/status', (req: AuthRequest, res: Response) => {
  try {
    res.json({
      active: currentGameState === 'RUNNING',
      gameState: currentGameState,
      lastBackup: sessionLastBackupTime
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/game/backup', async (req: AuthRequest, res: Response) => {
  try {
    if (currentGameState !== 'RUNNING') {
      return res.status(400).json({ error: 'Backup engine inactive: The realm must be RUNNING to take backups.' });
    }
    const result = await createBackupSnapshot('backup.json');
    setSessionLastBackupTime(result.savedAt);
    getIO().emit('backup_update', { lastBackup: sessionLastBackupTime, active: true });
    res.json({ success: true, message: 'Atomic backup created successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/game/save', async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body || {};
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = name 
      ? `save_${name.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}_${timestampStr}.json`
      : `save_${timestampStr}.json`;
    const result = await createBackupSnapshot(safeName);
    res.json({ success: true, message: `Saved realm snapshot as ${safeName}`, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/game/saves', (req: AuthRequest, res: Response) => {
  try {
    const saves = listAvailableSaves();
    res.json({ saves });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/game/load', async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    const result = await restoreSaveSnapshot(getIO(), filename);
    setSessionLastBackupTime(result.savedAt);
    getIO().emit('backup_update', { lastBackup: sessionLastBackupTime, active: false });
    res.json({ success: true, message: `Successfully restored state from ${filename} in PAUSED mode`, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Cards Engine ---

router.get('/cards', async (req: AuthRequest, res: Response) => {
  try {
    const cards = await prisma.card.findMany({
      include: { team: { select: { teamId: true } } }
    });
    res.json(cards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cards/assign', async (req: AuthRequest, res: Response) => {
  const { cardId, teamId } = req.body;
  try {
    const updated = await prisma.card.update({
      where: { id: Number(cardId) },
      data: {
        teamId: teamId || null,
        assignedAt: teamId ? new Date() : null,
        isBuilt: false,
        isActive: false
      }
    });
    getIO().emit('cards_updated');
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cards/toggle-disable', async (req: AuthRequest, res: Response) => {
  const { cardId } = req.body;
  try {
    const card = await prisma.card.findUnique({ where: { id: Number(cardId) } });
    if (!card) throw new Error("Card not found");
    const updated = await prisma.card.update({
      where: { id: Number(cardId) },
      data: { isDisabled: !card.isDisabled, isActive: false }
    });
    getIO().emit('cards_updated');
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cards/toggle-build', async (req: AuthRequest, res: Response) => {
  const { cardId } = req.body;
  try {
    const card = await prisma.card.findUnique({ where: { id: Number(cardId) } });
    if (!card) throw new Error("Card not found");
    const newIsBuilt = !card.isBuilt;
    const dataToUpdate: any = { isBuilt: newIsBuilt };
    if (!newIsBuilt) {
      dataToUpdate.isActive = false;
    }
    const updated = await prisma.card.update({
      where: { id: Number(cardId) },
      data: dataToUpdate
    });
    getIO().emit('cards_updated');
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
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
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
