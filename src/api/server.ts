import express from 'express';
import path from 'path';
import prisma from '../utils/prisma';
import { config } from '../config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../../public'), { extensions: ['html'] }));

// API: Combined stats
app.get('/api/stats', async (_req, res) => {
  try {
    const [guilds, users, prayers, games, reminders, badges, challenges] = await Promise.all([
      prisma.guild.count(),
      prisma.user.count(),
      prisma.prayerLog.count(),
      prisma.gameScore.count(),
      prisma.reminder.count({ where: { active: true } }),
      prisma.userBadge.count(),
      prisma.weeklyChallenge.count({ where: { active: true } }),
    ]);
    res.json({ guilds, users, prayers, games, reminders, badges, challenges, version: config.version, botName: config.botName });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

// API: Leaderboard
app.get('/api/leaderboard', async (_req, res) => {
  try {
    const top = await prisma.userPoint.findMany({
      orderBy: { total: 'desc' },
      take: 20,
    });
    res.json(top.map(u => ({ id: u.userId, points: u.total, level: u.level })));
  } catch {
    res.json([]);
  }
});

// API: Prayer leaderboard
app.get('/api/prayer-leaderboard', async (_req, res) => {
  try {
    const top = await prisma.prayerLog.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    res.json(top.map(u => ({ id: u.userId, count: u._count.id })));
  } catch {
    res.json([]);
  }
});

// API: Reminders
app.get('/api/reminders', async (_req, res) => {
  try {
    const count = await prisma.reminder.count();
    const active = await prisma.reminder.count({ where: { active: true } });
    res.json({ total: count, active });
  } catch {
    res.json({ total: 0, active: 0 });
  }
});

// API: Commands list
app.get('/api/commands', async (_req, res) => {
  try {
    const files = ['adhkar', 'fatawa', 'games', 'hadith', 'history', 'prayer', 'quran', 'settings', 'zakat'];
    const fs = await import('fs');
    const pathMod = await import('path');
    const cmdDir = pathMod.default.join(__dirname, '../../src/commands/_main');
    const result = [];

    for (const f of files) {
      const content = fs.readFileSync(pathMod.default.join(cmdDir, f + '.ts'), 'utf-8');
      const cmdMatch = content.match(/\.setName\('([^']+)'\)/);
      const cmdName = cmdMatch ? cmdMatch[1] : f;

      const subRe = /addSubcommand\s*\(\s*(?:\w+\s*=>\s*)?\w+\s*\.\s*setName\s*\(\s*'([^']+)'\s*\)\s*\.\s*setDescription\s*\(\s*'([^']+)'\s*\)/g;
      const subs = [];
      let m;
      while ((m = subRe.exec(content)) !== null) {
        const subName = m[1];
        const subDesc = m[2];
        const startIdx = m.index + m[0].length;
        const remaining = content.slice(startIdx, startIdx + 2000);
        const optRe = /add\w+Option\s*\(\s*(?:\w+\s*=>\s*)?\w+\s*\.\s*setName\s*\(\s*'([^']+)'\s*\)/g;
        const opts = [];
        let o;
        while ((o = optRe.exec(remaining)) !== null) {
          const nextSub = remaining.slice(0, o.index).search(/addSubcommand\s*\(/);
          if (nextSub >= 0 && nextSub < o.index) break;
          opts.push(o[1]);
        }
        subs.push({ name: subName, desc: subDesc, opts });
      }
      result.push({ cmd: cmdName, subs });
    }
    res.json(result);
  } catch {
    res.json([]);
  }
});

// API: Config info (safe)
app.get('/api/config', (_req, res) => {
  res.json({ version: config.version, botName: config.botName });
});



export function startApi(): void {
  app.listen(PORT, () => {
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  });
}
