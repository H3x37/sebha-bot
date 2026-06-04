import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import prisma from '../../utils/prisma';
import { buildEmbed, errorEmbed } from '../../utils/embed';

export default {
  data: new SlashCommandBuilder()
    .setName('لوحة-الصلاة')
    .setDescription('لوحة شرف المصلين في السيرفر'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
      return;
    }

    await interaction.deferReply();

    try {
      const members = await interaction.guild.members.fetch();
      const memberIds = [...members.keys()];

      const topUsers = await prisma.userPoint.findMany({
        where: { userId: { in: memberIds } },
        orderBy: { prayerPts: 'desc' },
        take: 10,
        include: { user: true },
      });

      if (topUsers.length === 0) {
        await interaction.editReply({ embeds: [errorEmbed('لا يوجد مصلين مسجلين في هذا السيرفر بعد.')] });
        return;
      }

      const medals = ['🥇', '🥈', '🥉'];
      const lines = topUsers.map((u, i) => {
        const medal = medals[i] || `${i + 1}.`;
        const member = members.get(u.userId);
        const name = member?.displayName || u.user.username;
        return `${medal} **${name}** — ${u.prayerPts} نقطة 🔥 ${u.streak} يوم`;
      });

      const embed = buildEmbed('prayer', {
        title: 'لوحة شرف الصلاة',
        description: lines.join('\n'),
        footer: 'حافظ على صلواتك وارفع رصيدك',
      });

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed('حدث خطأ أثناء جلب اللوحة.')] });
    }
  },
  category: 'prayer',
} as Command;
