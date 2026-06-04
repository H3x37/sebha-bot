import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  query: (userId: string) => Promise<number>;
  target: number;
}

const allBadges: BadgeDef[] = [
  {
    id: 'الحافظ', name: 'الحافظ', desc: 'احفظ ١٠٠ آية قرآنية', icon: '📖',
    query: async (userId) => {
      const khatma = await prisma.khatmaProgress.findFirst({ where: { userId } });
      return (khatma?.page || 0) * 15;
    },
    target: 100,
  },
  {
    id: 'المصلي', name: 'المصلي', desc: 'سجل ٥٠ صلاة', icon: '🕌',
    query: async (userId) => prisma.prayerLog.count({ where: { userId } }),
    target: 50,
  },
  {
    id: 'الذاكر', name: 'الذاكر', desc: 'أكثر من ٥٠٠ ذكر', icon: '🫶',
    query: async (userId) => {
      const pts = await prisma.userPoint.findUnique({ where: { userId } });
      return pts?.total || 0;
    },
    target: 500,
  },
  {
    id: 'العالم', name: 'العالم', desc: 'احصل على ١٠٠ نقطة في المسابقات', icon: '📚',
    query: async (userId) => {
      const pts = await prisma.userPoint.findUnique({ where: { userId } });
      return pts?.quizPts || 0;
    },
    target: 100,
  },
  {
    id: 'الصائم', name: 'الصائم', desc: 'تتبع صيامك', icon: '🌙',
    query: async () => 0,
    target: 1,
  },
];

function progressBar(current: number, max: number, length = 10) {
  const filled = Math.min(Math.round((current / max) * length), length);
  return '🟢'.repeat(filled) + '⚪'.repeat(length - filled);
}

export default {
  data: new SlashCommandBuilder()
    .setName('إنجازاتي')
    .setDescription('عرض شاراتك وإنجازاتك'),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    const [earnedBadges, ...progressValues] = await Promise.all([
      prisma.userBadge.findMany({ where: { userId } }),
      ...allBadges.map(b => b.query(userId)),
    ]);

    const earnedIds = new Set(earnedBadges.map(b => b.badgeId));

    const badgeLines = allBadges.map((badge, i) => {
      const earned = earnedIds.has(badge.id);
      const progress = progressValues[i];
      const display = Math.min(progress, badge.target);

      const bar = earned
        ? '🟢'.repeat(10) + ' ✅'
        : `${progressBar(display, badge.target)}\n${display}/${badge.target}`;

      return `**${badge.icon} ${badge.name}**\n${badge.desc}\n${bar}`;
    });

    const earnedList = earnedBadges.map(b => {
      const def = allBadges.find(a => a.id === b.badgeId);
      return `${def?.icon || '🏅'} ${b.badgeName}`;
    });

    const embed = buildEmbed('community', {
      title: 'إنجازاتي',
      description: earnedBadges.length > 0
        ? `أهلاً **${interaction.user.username}**! 🎉\nلديك **${earnedBadges.length}** شارة:\n${earnedList.join(' - ')}`
        : `أهلاً **${interaction.user.username}**! ابدأ رحلتك لتحقيق الشارات 🎯`,
      fields: badgeLines.map((value, i) => ({
        name: '\u200B',
        value,
        inline: false,
      })),
      footer: 'واصل الطاعة تجمع حسناتك وتنال الشارات',
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'community',
} as Command;
