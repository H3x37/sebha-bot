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

function getLevel(total: number) {
  let current = levels[0];
  for (const l of levels) {
    if (total >= l.minPoints) current = l;
  }
  return current;
}

const levelEmojis: Record<string, string> = {
  'طالب علم': '📖',
  'مثقف': '📚',
  'عالم': '🔬',
  'شيخ': '👳',
  'قدوة': '🌟',
};

export default {
  data: new SlashCommandBuilder()
    .setName('لوحة-الشرف')
    .setDescription('عرض أفضل 10 متسابقين'),

  async execute(interaction: ChatInputCommandInteraction) {
    const topUsers = await prisma.userPoint.findMany({
      orderBy: { total: 'desc' },
      take: 10,
      include: { user: true },
    });

    if (topUsers.length === 0) {
      await interaction.reply({ embeds: [errorEmbed('لا توجد نتائج بعد! ابدأ باللعب لكي تظهر في اللوحة.')], flags: 64 });
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const entries = topUsers.map((u, i) => {
      const medal = medals[i] || `${i + 1}.`;
      const levelInfo = getLevel(u.total);
      const emoji = levelEmojis[levelInfo.name] || '📖';
      return `${medal} **${u.user.username}** — ${u.total} نقطة ${emoji} ${levelInfo.name}`;
    });

    const embed = buildEmbed('games', {
      title: 'لوحة الشرف',
      description: entries.join('\n'),
      fields: topUsers.length > 0
        ? [
            { name: 'إجمالي المشاركين', value: `${topUsers.length}+`, inline: true },
            { name: 'أعلى نقاط', value: `${topUsers[0].total}`, inline: true },
          ]
        : [],
      footer: 'تابع اللعب لترتفع في الترتيب!',
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'games',
} as Command;
