import './config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

import { setIO } from './lib/socket';
import { setupSocketEngine } from './engine/socketEngine';
import { currentGameState, setSessionLastBackupTime } from './lib/state';
import { createBackupSnapshot } from './engine/backupWriter';
import { initPrisma, prisma } from './lib/db';
import { setGameState } from './lib/state';
import { PORT } from './config';

// Routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import participantRoutes from './routes/participant';
import gameRoutes from './routes/game';
import roundsRoutes from './routes/rounds';
import disastersRoutes from './routes/disasters';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Set global Socket.io instance
setIO(io);

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});

const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/team', participantRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', adminRoutes);
app.use('/api/rounds', roundsRoutes);
app.use('/api/disasters', disastersRoutes);

// Automated 1-minute Atomic Backup Daemon
setInterval(async () => {
  try {
    if (currentGameState === 'RUNNING') {
      const result = await createBackupSnapshot('backup.json');
      setSessionLastBackupTime(result.savedAt);
      io.emit('backup_update', { lastBackup: result.savedAt, active: true });
    }
  } catch (err) {
    console.error('[Auto-Backup Daemon Error]', err);
  }
}, 60 * 1000);

// Fallback for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Initialize Socket Engine
setupSocketEngine(io);

async function start() {
  await initPrisma();
  const savedConfig = await prisma.gameConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, state: 'NOT_STARTED' }
  });
  if (['NOT_STARTED', 'RUNNING', 'PAUSED', 'ENDED'].includes(savedConfig.state)) {
    setGameState(savedConfig.state as 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Shatranj server running on port ${PORT}`);
  });
}

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; saving game state before shutdown.`);
  try {
    if (currentGameState === 'RUNNING') await createBackupSnapshot('backup.json');
  } catch (error) {
    console.error('[Shutdown backup error]', error);
  }
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((error) => {
  console.error('[Startup error]', error);
  process.exit(1);
});

// trigger restart
