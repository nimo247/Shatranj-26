import { Router, Response } from 'express';
import { prisma } from '../lib/db';
import { getIO } from '../lib/socket';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

export async function getTeamsStateWithDebuffs(tx: any = prisma) {
  const teams = await tx.team.findMany({
    where: { role: 'TEAM' },
    include: { cards: true }, // include all to count built cards
    orderBy: { teamId: 'asc' }
  });
  
  const activeDebuffs = await tx.activeDebuff.findMany();
  
  const stateData = teams.map((team: any) => {
    let netFood = 0;
    let netMaterial = 0;
    let netGold = 0;
    
    let baseFoodReturn = 0;
    let baseMaterialReturn = 0;
    let baseGoldReturn = 0;
    
    let baseFoodSustain = 0;
    let baseMaterialSustain = 0;
    let baseGoldSustain = 0;

    let activeFoodCardsCount = 0;
    let activeMaterialCardsCount = 0;
    let activeLuxuryCardsCount = 0;

    let builtFoodCardsCount = 0;
    let builtMaterialCardsCount = 0;
    let builtLuxuryCardsCount = 0;

    team.cards.forEach((c: any) => {
      if (c.isBuilt && !c.isElite) {
        if (c.type === 'FOOD') builtFoodCardsCount++;
        else if (c.type === 'MATERIAL') builtMaterialCardsCount++;
        else if (c.type === 'LUXURY') builtLuxuryCardsCount++;
      }
    });

    let normalFoodReturn = 0;
    let normalMaterialReturn = 0;
    let normalGoldReturn = 0;
    let normalFoodSustain = 0;
    let normalMaterialSustain = 0;
    let normalGoldSustain = 0;

    const activeCards = team.cards.filter((c: any) => c.isActive && !c.isDisabled).map((c: any) => {
      baseFoodReturn += c.returnFood;
      baseMaterialReturn += c.returnMaterial;
      baseGoldReturn += c.returnGold;
      
      baseFoodSustain += c.sustainCostFood;
      baseMaterialSustain += c.sustainCostMaterial;
      baseGoldSustain += c.sustainCostGold;
      
      netFood += (c.returnFood - c.sustainCostFood);
      netMaterial += (c.returnMaterial - c.sustainCostMaterial);
      netGold += (c.returnGold - c.sustainCostGold);

      if (!c.isElite) {
        normalFoodReturn += c.returnFood;
        normalMaterialReturn += c.returnMaterial;
        normalGoldReturn += c.returnGold;
        normalFoodSustain += c.sustainCostFood;
        normalMaterialSustain += c.sustainCostMaterial;
        normalGoldSustain += c.sustainCostGold;
        
        if (c.type === 'FOOD') activeFoodCardsCount++;
        else if (c.type === 'MATERIAL') activeMaterialCardsCount++;
        else if (c.type === 'LUXURY') activeLuxuryCardsCount++;
      }

      
      return {
        id: c.id,
        name: c.name,
        upkeepFood: c.sustainCostFood,
        upkeepMaterial: c.sustainCostMaterial,
        upkeepGold: c.sustainCostGold,
        returnFood: c.returnFood,
        returnMaterial: c.returnMaterial,
        returnGold: c.returnGold,
        type: c.type,
        isElite: c.isElite
      };
    });
    
    const builtCardsCount = team.cards.filter((c: any) => c.isBuilt).length;
    const activeCardsCount = activeCards.length;
    
    // Apply Active Debuffs
    for (const debuff of activeDebuffs) {
      let applies = !debuff.isRegional;
        if (debuff.isRegional) {
          try {
            const regs = JSON.parse(debuff.regions).map((r: string) => r.toLowerCase().replace(/^the\s+/, ''));
            const tReg = (team.region || '').toLowerCase().replace(/^the\s+/, '');
            const tId = team.teamId.toLowerCase();
            if (regs.includes(tReg) || regs.includes(tId)) applies = true;
          } catch(e) {}
        }
                      
      if (applies) {
        let debuffFoodReturn = 0;
        let debuffMaterialReturn = 0;
        let debuffGoldReturn = 0;
        let debuffFoodSustain = 0;
        let debuffMaterialSustain = 0;
        let debuffGoldSustain = 0;
        
        const cap = debuff.maxCap;

        const applyMod = (base: number, modifier: number) => {
           if (!modifier) return 0;
           let delta = base * modifier;
           return Math.round(delta);
        };

        debuffFoodReturn = applyMod(normalFoodReturn, debuff.foodReturn);
        debuffMaterialReturn = applyMod(normalMaterialReturn, debuff.materialReturn);
        debuffGoldReturn = applyMod(normalGoldReturn, debuff.goldReturn);
        debuffFoodSustain = applyMod(normalFoodSustain, debuff.foodSustain);
        debuffMaterialSustain = applyMod(normalMaterialSustain, debuff.materialSustain);
        debuffGoldSustain = applyMod(normalGoldSustain, debuff.goldSustain);
        
        netFood += (debuffFoodReturn - debuffFoodSustain);
        netMaterial += (debuffMaterialReturn - debuffMaterialSustain);
        netGold += (debuffGoldReturn - debuffGoldSustain);
        
        if (debuffFoodReturn !== 0 || debuffMaterialReturn !== 0 || debuffGoldReturn !== 0 ||
            debuffFoodSustain !== 0 || debuffMaterialSustain !== 0 || debuffGoldSustain !== 0) {
          activeCards.push({
            id: `disaster_${debuff.id}`,
            name: `Disaster: ${debuff.disasterName}`,
            upkeepFood: debuffFoodSustain,
            upkeepMaterial: debuffMaterialSustain,
            upkeepGold: debuffGoldSustain,
            returnFood: debuffFoodReturn,
            returnMaterial: debuffMaterialReturn,
            returnGold: debuffGoldReturn,
            isDisaster: true
          });
        }
      }
    }
    
    const hasFoodUpkeep = (team.food + netFood) >= 0;
    const hasMaterialUpkeep = (team.material + netMaterial) >= 0;

    let appliedDebuffs = [];
    for (const d of activeDebuffs) {
      let app = !d.isRegional;
       if (d.isRegional) {
           try {
             const r = JSON.parse(d.regions).map((r: string) => r.toLowerCase().replace(/^the\s+/, ''));
             const tReg = (team.region || '').toLowerCase().replace(/^the\s+/, '');
             const tId = team.teamId.toLowerCase();
             if (r.includes(tReg) || r.includes(tId)) app = true;
           } catch(e){}
        }
      if (app) appliedDebuffs.push(d);
    }

    return {
      id: team.id,
      teamId: team.teamId,
      region: team.region,
      food: team.food,
      material: team.material,
      gold: team.gold,
      activeCards,
      activeCardsCount,
      activeFoodCardsCount,
      activeMaterialCardsCount,
      activeLuxuryCardsCount,
      builtCardsCount,
      builtFoodCardsCount,
      builtMaterialCardsCount,
      builtLuxuryCardsCount,
      netFood,
      netMaterial,
      netGold,
      hasFoodUpkeep,
      hasMaterialUpkeep,
      canAfford: hasFoodUpkeep && hasMaterialUpkeep,
      appliedDebuffs
    };
  });
  
  return { stateData, activeDebuffs };
}

router.get('/state', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { stateData } = await getTeamsStateWithDebuffs(prisma);
    
    const snapshots = await prisma.roundSnapshot.findMany({ orderBy: { roundNum: 'asc' } });
    const currentRound = snapshots.length > 0 ? Math.max(...snapshots.map(s => s.roundNum)) : 0;
    
    res.json({ teams: stateData, currentRound, snapshots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/log', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updatedTeams: any[] = [];
    
    await prisma.$transaction(async (tx) => {
      const { stateData, activeDebuffs } = await getTeamsStateWithDebuffs(tx);
      
      const snapshots = await tx.roundSnapshot.findMany({ orderBy: { roundNum: 'desc' } });
      const currentRound = snapshots.length > 0 ? snapshots[0].roundNum : 0;
      const newRound = currentRound + 1;
      
      const insufficientTeams = stateData.filter((d: any) => !d.canAfford).map((d: any) => d.teamId);
      
      if (insufficientTeams.length > 0) {
        throw new Error(`Insufficient funds: ${insufficientTeams.join(', ')}`);
      }
      
      for (const data of stateData) {
        const updated = await tx.team.update({
          where: { id: data.id },
          data: {
            food: { increment: data.netFood },
            material: { increment: data.netMaterial },
            gold: { increment: data.netGold }
          }
        });
        updatedTeams.push(updated);
      }
      
      // Save snapshot metadata text lines
      const activeEffectsText = activeDebuffs.map((d: any) => `${d.description}`).join(' | ');

      await tx.roundSnapshot.create({
        data: {
          roundNum: newRound,
          data: JSON.stringify({
            teams: stateData,
            events: activeEffectsText ? [activeEffectsText] : []
          })
        }
      });
    });
    
    for (const ut of updatedTeams) {
      getIO().to(`team_${ut.id}`).emit('team_hud_update', ut);
    }
    getIO().emit('admin_refresh');
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/set', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  const { roundNum } = req.body;
  try {
    if (roundNum === 0) {
       await prisma.roundSnapshot.deleteMany({});
       await prisma.disasterLog.deleteMany({});
       await prisma.activeDebuff.deleteMany({});
    } else {
       const existing = await prisma.roundSnapshot.findUnique({ where: { roundNum: Number(roundNum) } });
       if (!existing) {
         await prisma.roundSnapshot.create({
           data: {
             roundNum: Number(roundNum),
             data: JSON.stringify([])
           }
         });
       }
    }
    getIO().emit('admin_refresh');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.roundSnapshot.deleteMany({});
    await prisma.disasterLog.deleteMany({});
    await prisma.activeDebuff.deleteMany({});
    getIO().emit('admin_refresh');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
