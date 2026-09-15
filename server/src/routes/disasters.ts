import { Router, Response } from 'express';
import { prisma } from '../lib/db';
import { getIO } from '../lib/socket';
import { broadcastLedger } from '../engine/socketEngine';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { disasterTemplates } from '../data/disasterTemplates';

const router = Router();

router.get('/', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const customDisasters = await prisma.customDisaster.findMany();
    const parsedCustoms = customDisasters.map(cd => {
      try {
        const data = JSON.parse(cd.data);
        return { ...data, isCustom: true };
      } catch (e) { return null; }
    }).filter(Boolean);

    res.json([...disasterTemplates, ...parsedCustoms]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/debuffs', async (req, res) => {
  try {
    const debuffs = await prisma.activeDebuff.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(debuffs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.disasterLog.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/active', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const active = await prisma.activeDebuff.findMany();
    res.json(active);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/execute', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      disasterName, 
      description, 
      isRegional, 
      regions, 
      flatLosses, // array of { teamId, food, material, gold }
        flatLossTarget,
      modifiers, // { foodSustain, foodReturn, materialSustain, materialReturn, goldSustain, goldReturn }
      maxCap, // 0 to 1
      roundNum
    } = req.body;

    const impactedTeamsData: any = {};

    await prisma.$transaction(async (tx) => {
      // Handle Flat Losses
      if (flatLosses && flatLosses.length > 0) {
        for (const loss of flatLosses) {
           const team = await tx.team.findUnique({ where: { id: loss.teamId } });
           if (!team) continue;

           const maxFoodLoss = Math.floor(team.food * maxCap);
           const maxMaterialLoss = Math.floor(team.material * maxCap);
           const maxGoldLoss = Math.floor(team.gold * maxCap);

           const actualFoodLoss = Math.min(loss.food || 0, maxFoodLoss);
           const actualMaterialLoss = Math.min(loss.material || 0, maxMaterialLoss);
           const actualGoldLoss = Math.min(loss.gold || 0, maxGoldLoss);

           impactedTeamsData[team.teamId] = {
             foodLost: actualFoodLoss,
             materialLost: actualMaterialLoss,
             goldLost: actualGoldLoss
           };

           await tx.team.update({
             where: { id: loss.teamId },
             data: {
               food: { decrement: actualFoodLoss },
               material: { decrement: actualMaterialLoss },
               gold: { decrement: actualGoldLoss }
             }
           });
        }
      }

      // Handle Production Multipliers
      if (modifiers) {
        const hasMods = Object.values(modifiers).some((v: any) => v !== 0 && v !== null);
        if (hasMods) {
          await tx.activeDebuff.create({
            data: {
              disasterName,
              description,
              isRegional,
              regions: JSON.stringify(regions || []),
              roundApplied: roundNum,
                cardTarget: flatLossTarget || 'ACTIVE',
              maxCap,
              foodSustain: modifiers.foodSustain || 0,
              foodReturn: modifiers.foodReturn || 0,
              materialSustain: modifiers.materialSustain || 0,
              materialReturn: modifiers.materialReturn || 0,
              goldSustain: modifiers.goldSustain || 0,
              goldReturn: modifiers.goldReturn || 0
            }
          });
        }
      }

      // Record Log
      await tx.disasterLog.create({
        data: {
          roundNum,
          disasterName,
          description,
          impactedTeams: JSON.stringify(impactedTeamsData),
          isRegional
        }
      });
    });

    getIO().emit('admin_refresh');
    // Notify teams that a debuff happened so they reload their UI
    getIO().emit('disaster_refresh'); 
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/debuffs/:id/remove', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.activeDebuff.delete({
      where: { id: Number(req.params.id) }
    });
    getIO().emit('admin_refresh');
    getIO().emit('disaster_refresh');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/custom', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const disaster = req.body;
    if (!disaster || !disaster.name) return res.status(400).json({ error: 'Name is required' });

    // UPSERT custom disaster
    const saved = await prisma.customDisaster.upsert({
      where: { name: disaster.name },
      update: { data: JSON.stringify(disaster) },
      create: { name: disaster.name, data: JSON.stringify(disaster) }
    });
    const io = getIO();
    io.emit('disaster_refresh');
    res.json({ success: true, customDisaster: saved });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/custom/:name', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.params;
    
    // Delete from CustomDisaster
    await prisma.customDisaster.delete({ where: { name } });

    // Also remove any active debuffs created by this disaster
    await prisma.activeDebuff.deleteMany({ where: { disasterName: name } });

    // Broadcast update since active debuffs might have changed
    const io = getIO();
    broadcastLedger(io);
    io.emit('disaster_refresh');
    io.emit('admin_refresh');

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
