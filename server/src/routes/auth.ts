import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';
import { ADMIN_KEYWORD, JWT_SECRET } from '../config';

const router = Router();

router.post('/', async (req, res) => {
  const { teamId, password } = req.body;
  if (!teamId || !password) return res.status(400).json({ error: 'Missing credentials' });

  if (teamId === 'ADMIN') {
    if (password === ADMIN_KEYWORD) {
      const adminTeam = await prisma.team.findUnique({ where: { teamId: 'ADMIN' } });
      if (!adminTeam) return res.status(500).json({ error: 'Admin account not seeded' });
      const token = jwt.sign({ id: adminTeam.id, teamId: 'ADMIN', role: 'ADMIN' }, JWT_SECRET);
      return res.json({ token, teamId: 'ADMIN', role: 'ADMIN' });
    }
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  const team = await prisma.team.findUnique({ where: { teamId } });
  if (!team || team.password !== password) {
    return res.status(401).json({ error: 'Invalid team credentials' });
  }

  const token = jwt.sign({ id: team.id, teamId: team.teamId, role: team.role }, JWT_SECRET);
  return res.json({ token, teamId: team.teamId, role: team.role, id: team.id });
});

export default router;
