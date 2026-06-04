import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

const gameTypeNames: Record<string, string> = {
  'quran-quiz': 'مسابقة قرآن',
  'who-am-i': 'من أنا',
  'complete-ayah': 'أكمل الآية',
  'islamic-test': 'اختبار ديني',
};

export default {
  data: new SlashCommandBuilder()
    .setName('إحصائيات')
    .setDescription('عرض إحصائيات العبادة في السيرفر'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات.')], flags: 64 });
      return;
    }

    const guildId = interaction.guildId;

    const [totalPrayers, totalGames, activeParticipants, activeChallenges, gameGroups] =
      await Promise.all([
        prisma.prayerLog.count(),
        prisma.gameScore.count(),
        prisma.khatmaParticipant.count({ where: { guildId } }),
        prisma.weeklyChallenge.count({ where: { guildId, active: true } }),
        prisma.gameScore.groupBy({
          by: ['gameType'],
          _count: true,
          orderBy: { _count: { gameType: 'desc' } },
        }),
      ]);

    const topGame = gameGroups[0];

    const embed = buildEmbed('community', {
      title: `إحصائيات ${interaction.guild?.name}`,
      description: 'إحصائيات عامة للعبادة والمسابقات في السيرفر',
      fields: [
        { name: 'إجمالي الصلوات المسجلة', value: `**${totalPrayers}** صلاة`, inline: true },
        { name: 'إجمالي الألعاب', value: `**${totalGames}** لعبة`, inline: true },
        { name: 'مشاركون في الختمة', value: `**${activeParticipants}** عضو`, inline: true },
        { name: 'تحديات نشطة', value: `**${activeChallenges}** تحدي`, inline: true },
        ...(topGame
          ? [{
              name: 'اللعبة الأكثر لعباً',
              value: `${gameTypeNames[topGame.gameType] || topGame.gameType} (${topGame._count} مرة)`,
              inline: false,
            }]
          : []),
      ],
      footer: `${interaction.guild?.name} • أحصاها الله ونسوها`,
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'community',
} as Command;
