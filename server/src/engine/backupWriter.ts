import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import { prisma } from '../lib/db';
import { currentGameState, setGameState } from '../lib/state';
import { broadcastLedger, sendTeamUpdate } from './socketEngine';

const SAVES_DIR = process.env.SAVES_DIR
  ? path.resolve(process.env.SAVES_DIR)
  : path.resolve(__dirname, '../saves');

function ensureSavesDir() {
  if (!fs.existsSync(SAVES_DIR)) {
    fs.mkdirSync(SAVES_DIR, { recursive: true });
  }
}

export async function createBackupSnapshot(targetFilename: string = 'backup.json') {
  ensureSavesDir();

  const teams = await prisma.team.findMany();
  const orders = await prisma.order.findMany();
  const mails = await prisma.mail.findMany();
  const cards = await prisma.card.findMany();
  const roundSnapshots = await prisma.roundSnapshot.findMany();
  const activeDebuffs = await prisma.activeDebuff.findMany();
  const disasterLogs = await prisma.disasterLog.findMany();
  const customDisasters = await prisma.customDisaster.findMany();

  const snapshot = {
    version: 2,
    savedAt: new Date().toISOString(),
    gameState: currentGameState,
    teams,
    orders,
    mails,
    cards,
    roundSnapshots,
    activeDebuffs,
    disasterLogs,
    customDisasters
  };

  const tempFile = path.join(SAVES_DIR, `.tmp_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
  const finalFile = path.join(SAVES_DIR, targetFilename);

  fs.writeFileSync(tempFile, JSON.stringify(snapshot, null, 2), 'utf-8');
  fs.renameSync(tempFile, finalFile); // Safe atomic swap

  return {
    filename: targetFilename,
    savedAt: snapshot.savedAt,
    teamCount: teams.length,
    orderCount: orders.length,
    gameState: currentGameState
  };
}

export function listAvailableSaves() {
  ensureSavesDir();
  const files = fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.json') && !f.startsWith('.tmp'));

  const items = files.map(file => {
    const fullPath = path.join(SAVES_DIR, file);
    const stats = fs.statSync(fullPath);
    let meta: any = null;
    try {
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      meta = {
        savedAt: content.savedAt,
        gameState: content.gameState,
        teamCount: content.teams?.length || 0,
        orderCount: content.orders?.length || 0
      };
    } catch (e) {
      // Ignore if corrupt
    }

    return {
      filename: file,
      displayName: file === 'backup.json' ? '⚡ Current Auto-Backup (backup.json)' : `💾 ${file}`,
      isBackup: file === 'backup.json',
      size: stats.size,
      mtime: stats.mtime,
      meta
    };
  });

  // Sort: backup.json first, then latest modified saves
  items.sort((a, b) => {
    if (a.isBackup) return -1;
    if (b.isBackup) return 1;
    return new Date(b.mtime).getTime() - new Date(a.mtime).getTime();
  });

  return items;
}

export async function restoreSaveSnapshot(io: Server, filename: string) {
  ensureSavesDir();

  // Prevent path traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(SAVES_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Save file '${safeFilename}' not found`);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const snapshot = JSON.parse(rawData);

  if (!snapshot || !Array.isArray(snapshot.teams)) {
    throw new Error('Invalid save file format: Missing teams array');
  }

  // Atomic database restoration
  await prisma.$transaction(async (tx) => {
    // 1. Delete/Reset all existing records
    await tx.mail.deleteMany({});
    await tx.order.deleteMany({});
    await tx.team.deleteMany({});
    await tx.roundSnapshot.deleteMany({});
    await tx.activeDebuff.deleteMany({});
    await tx.disasterLog.deleteMany({});
    await tx.gameConfig.upsert({
      where: { id: 1 },
      update: { state: 'PAUSED' },
      create: { id: 1, state: 'PAUSED' }
    });
    await tx.card.updateMany({ 
      data: { isBuilt: false, isActive: false, isDisabled: false, teamId: null } 
    });

    // 2. Insert Teams
    for (const team of snapshot.teams) {
      await tx.team.create({
        data: {
          id: team.id,
          teamId: team.teamId,
          teamName: team.teamName,
          password: team.password,
          region: team.region,
          role: team.role || 'TEAM',
          food: team.food,
          escrowFood: team.escrowFood || 0,
          material: team.material,
          escrowMaterial: team.escrowMaterial || 0,
          gold: team.gold,
          escrowGold: team.escrowGold || 0,
          createdAt: team.createdAt ? new Date(team.createdAt) : new Date(),
          updatedAt: team.updatedAt ? new Date(team.updatedAt) : new Date(),
        }
      });
    }

    // 3. Insert Orders
    if (Array.isArray(snapshot.orders)) {
      for (const order of snapshot.orders) {
        await tx.order.create({
          data: {
            id: order.id,
            creatorId: order.creatorId,
            targetTeamId: order.targetTeamId || null,
            resourceType: order.resourceType,
            orderType: order.orderType,
            amount: order.amount,
            price: order.price,
            status: order.status || 'OPEN',
            isAdminOrder: !!order.isAdminOrder,
            createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
          }
        });
      }
    }

    // 4. Insert Mails
    if (Array.isArray(snapshot.mails)) {
      for (const mail of snapshot.mails) {
        await tx.mail.create({
          data: {
            id: mail.id,
            teamId: mail.teamId,
            title: mail.title,
            body: mail.body,
            isRead: !!mail.isRead,
            createdAt: mail.createdAt ? new Date(mail.createdAt) : new Date(),
          }
        });
      }
    }

    // 5. Restore Cards
    if (Array.isArray(snapshot.cards)) {
      for (const card of snapshot.cards) {
        await tx.card.update({
          where: { id: card.id },
          data: {
            teamId: card.teamId || null,
            isBuilt: !!card.isBuilt,
            isActive: !!card.isActive,
            isDisabled: !!card.isDisabled,
            assignedAt: card.assignedAt ? new Date(card.assignedAt) : null,
            updatedAt: card.updatedAt ? new Date(card.updatedAt) : new Date(),
          }
        });
      }
    }

    // Restore ActiveDebuffs
    if (Array.isArray(snapshot.activeDebuffs)) {
      for (const debuff of snapshot.activeDebuffs) {
        await tx.activeDebuff.create({
          data: {
            id: debuff.id,
            disasterName: debuff.disasterName,
            description: debuff.description,
            isRegional: debuff.isRegional,
            regions: debuff.regions,
            roundApplied: debuff.roundApplied,
            createdAt: debuff.createdAt ? new Date(debuff.createdAt) : new Date(),
            maxCap: debuff.maxCap,
            foodSustain: debuff.foodSustain,
            foodReturn: debuff.foodReturn,
            materialSustain: debuff.materialSustain,
            materialReturn: debuff.materialReturn,
            goldSustain: debuff.goldSustain,
            goldReturn: debuff.goldReturn
          }
        });
      }
    }

    // Restore DisasterLogs
    if (Array.isArray(snapshot.disasterLogs)) {
      for (const log of snapshot.disasterLogs) {
        await tx.disasterLog.create({
          data: {
            id: log.id,
            timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
            roundNum: log.roundNum,
            disasterName: log.disasterName,
            description: log.description,
            impactedTeams: log.impactedTeams,
            isRegional: log.isRegional
          }
        });
      }
    }

    // Restore CustomDisasters
    await tx.customDisaster.deleteMany({});
    if (Array.isArray(snapshot.customDisasters)) {
      for (const cd of snapshot.customDisasters) {
        await tx.customDisaster.create({
          data: {
            id: cd.id,
            name: cd.name,
            data: cd.data,
            createdAt: cd.createdAt ? new Date(cd.createdAt) : new Date()
          }
        });
      }
    }

    // 6. Restore RoundSnapshots
    if (Array.isArray(snapshot.roundSnapshots)) {
      for (const rs of snapshot.roundSnapshots) {
        await tx.roundSnapshot.create({
          data: {
            id: rs.id,
            roundNum: rs.roundNum,
            createdAt: rs.createdAt ? new Date(rs.createdAt) : new Date(),
            data: rs.data
          }
        });
      }
    }
  });

  // 5. Update In-Memory Game State: Strictly force 'PAUSED' upon snapshot restore
  const newGameState = 'PAUSED';
  setGameState(newGameState);

  // 6. Broadcast full updates
  io.emit('game_state_update', newGameState);
  await broadcastLedger(io);

  const allTeams = await prisma.team.findMany();
  for (const t of allTeams) {
    if (t.role !== 'ADMIN') {
      await sendTeamUpdate(io, t.id);
    }
  }
  io.emit('admin_refresh');

  return {
    filename: safeFilename,
    savedAt: snapshot.savedAt,
    gameState: newGameState,
    teamCount: snapshot.teams.length,
    orderCount: snapshot.orders?.length || 0
  };
}

export function getLastBackupInfo() {
  ensureSavesDir();
  const backupFile = path.join(SAVES_DIR, 'backup.json');
  if (!fs.existsSync(backupFile)) return null;
  try {
    const raw = fs.readFileSync(backupFile, 'utf-8');
    const data = JSON.parse(raw);
    return {
      savedAt: data.savedAt,
      teamCount: data.teams?.length || 0,
      orderCount: data.orders?.length || 0
    };
  } catch (e) {
    return null;
  }
}
