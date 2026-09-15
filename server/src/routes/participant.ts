import { Router, Response } from 'express';
import { prisma } from '../lib/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getIO } from '../lib/socket';

import { getTeamsStateWithDebuffs } from './rounds';

const router = Router();

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.user.id },
      include: { mails: { orderBy: { createdAt: 'desc' }, take: 10 } }
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const { stateData } = await getTeamsStateWithDebuffs(prisma);
    const myState = stateData.find((s: any) => s.id === team.id);

    const appliedDebuffs = myState ? myState.appliedDebuffs : [];
    const netFood = myState ? myState.netFood : 0;
    const netMaterial = myState ? myState.netMaterial : 0;
    const netGold = myState ? myState.netGold : 0;
    
    res.json({ ...team, appliedDebuffs, netFood, netMaterial, netGold });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { status: 'OPEN' },
          { isAdminOrder: true }
        ]
      },
      include: {
        creator: { select: { teamName: true, id: true } }
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

// --- Cards ---
router.get('/cards', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const cards = await prisma.card.findMany({
      where: { teamId: req.user.id }
    });
    res.json(cards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// (removed)

router.post('/cards/build', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { cardId } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const card = await tx.card.findUnique({ where: { id: Number(cardId) } });
      if (!card) throw new Error("Card not found");
      if (card.teamId !== req.user.id) throw new Error("Card does not belong to you");
      if (card.isBuilt) throw new Error("Card is already built");
      if (card.isDisabled) throw new Error("Card is disabled by admin");

      const team = await tx.team.findUnique({ where: { id: req.user.id } });
      if (!team) throw new Error("Team not found");

      const availableFood = team.food - team.escrowFood;
      const availableMaterial = team.material - team.escrowMaterial;
      const availableGold = team.gold - team.escrowGold;

      if (availableFood < card.buildCostFood || availableMaterial < card.buildCostMaterial || availableGold < card.buildCostGold) {
        throw new Error("Insufficient available resources to build");
      }

      await tx.team.update({
        where: { id: req.user.id },
        data: {
          food: { decrement: card.buildCostFood },
          material: { decrement: card.buildCostMaterial },
          gold: { decrement: card.buildCostGold }
        }
      });

      const updatedCard = await tx.card.update({
        where: { id: Number(cardId) },
        data: { isBuilt: true }
      });
      return updatedCard;
    });

    getIO().to(`team_${req.user.id}`).emit('team_hud_update', await prisma.team.findUnique({ where: { id: req.user.id } }));
    getIO().to('admins').emit('admin_refresh');
    getIO().emit('cards_updated');
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/cards/toggle-active', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { cardId } = req.body;
  try {
    const card = await prisma.card.findUnique({ where: { id: Number(cardId) } });
    if (!card) throw new Error("Card not found");
    if (card.teamId !== req.user.id) throw new Error("Card does not belong to you");
    if (card.isDisabled) throw new Error("Card is disabled by admin");
      if (!card.isBuilt) throw new Error("Card must be built before activation");

    const updated = await prisma.card.update({
      where: { id: Number(cardId) },
      data: { isActive: !card.isActive }
    });
    getIO().emit('cards_updated');
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
