import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

const levels = [
  { name: 'طالب علم', minPoints: 0 },
  { name: 'مثقف', minPoints: 100 },
  { name: 'عالم', minPoints: 300 },
  { name: 'شيخ', minPoints: 600 },
  { name: 'قدوة', minPoints: 1000 },
];

function getLevelInfo(total: number) {
  let current = levels[0];
  let next = levels[1];
  for (let i = 0; i < levels.length; i++) {
    if (total >= levels[i].minPoints) current = levels[i];
    if (i < levels.length - 1) next = levels[i + 1];
  }
  return { current, next };
}

function progressBar(current: number, max: number, length = 12) {
  const filled = Math.min(Math.round((current / max) * length), length);
  return '🟠'.repeat(filled) + '⚪'.repeat(length - filled);
}

export default {
  data: new SlashCommandBuilder()
    .setName('نقاطي')
    .setDescription('عرض نقاطك ومستواك'),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    const userPoint = await prisma.userPoint.findUnique({ where: { userId } });

    if (!userPoint) {
      await interaction.reply({ embeds: [errorEmbed('لم تبدأ بعد في اكتساب النقاط! العب بعض الألعاب أولاً.')], flags: 64 });
      return;
    }

    const total = userPoint.total;
    const { current, next } = getLevelInfo(total);
    const nextThreshold = next.minPoints;
    const pointsToNext = nextThreshold - total;
    const prevThreshold = current.minPoints;
    const progress = total - prevThreshold;
    const range = nextThreshold - prevThreshold;

    const bar = progressBar(progress, range);

    const gameScores = await prisma.gameScore.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: 10,
    });

    const stats = {
      totalCorrect: gameScores.reduce((s, g) => s + g.correct, 0),
      totalWrong: gameScores.reduce((s, g) => s + g.wrong, 0),
      totalGames: gameScores.length,
    };

    const gameTypes = [...new Set(gameScores.map(g => g.gameType))];

    const gameTypeNames: Record<string, string> = {
      'quran-quiz': '📖 مسابقة قرآن',
      'who-am-i': '🕋 من أنا',
      'complete-ayah': '📜 أكمل الآية',
      'islamic-test': '📝 اختبار ديني',
    };

    const recentGames = gameScores.slice(0, 5).map(g => {
      const name = gameTypeNames[g.gameType] || g.gameType;
      return `${name}: ${g.score} نقطة (${g.correct}/${g.correct + g.wrong})`;
    });

    const totalGamesAll = await prisma.gameScore.count({ where: { userId } });

    const embed = buildEmbed('games', {
      title: 'نقاطي',
      description: `أهلاً **${interaction.user.username}**!`,
      fields: [
        { name: 'الإجمالي', value: `**${total}** نقطة`, inline: false },
        { name: 'المستوى الحالي', value: current.name, inline: true },
        { name: 'المستوى التالي', value: `${next.name} (يبقى ${pointsToNext} نقطة)`, inline: true },
        { name: 'التقدم', value: `\`${bar}\`\n${progress}/${range}`, inline: false },
        { name: 'نقاط الألعاب', value: `${userPoint.gamePts}`, inline: true },
        { name: 'نقاط المسابقات', value: `${userPoint.quizPts}`, inline: true },
        { name: 'عدد الألعاب', value: `${totalGamesAll}`, inline: true },
        { name: 'إجابات صحيحة', value: `${stats.totalCorrect}`, inline: true },
        { name: 'إجابات خاطئة', value: `${stats.totalWrong}`, inline: true },
        ...(recentGames.length > 0
          ? [{ name: 'آخر النتائج', value: recentGames.join('\n') }]
          : []),
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'games',
} as Command;
