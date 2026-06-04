import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import prisma from '../../utils/prisma';
import { buildEmbed, errorEmbed } from '../../utils/embed';

export default {
  data: new SlashCommandBuilder()
    .setName('نقاط-صلاة')
    .setDescription('عرض نقاط الصلاة الخاصة بك'),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    await interaction.deferReply();

    try {
      const userPoint = await prisma.userPoint.findUnique({
        where: { userId },
      });

      const totalPrayers = await prisma.prayerLog.count({
        where: { userId },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayPrayers = await prisma.prayerLog.findMany({
        where: {
          userId,
          createdAt: { gte: today },
        },
        select: { prayer: true },
      });

      const todayNames = [...new Set(todayPrayers.map(p => p.prayer))];

      if (!userPoint) {
        const embed = buildEmbed('prayer', {
          title: 'نقاط الصلاة',
          description: 'لم تسجل أي صلاة بعد.\nاستخدم الأمر `/صليت` لبدء التسجيل!',
        });
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const embed = buildEmbed('prayer', {
        title: `نقاط الصلاة • ${interaction.user.displayName}`,
        fields: [
          { name: 'نقاط الصلاة', value: `${userPoint.prayerPts}`, inline: true },
          { name: 'سلسلة الأيام', value: `${userPoint.streak} يوم`, inline: true },
          { name: 'المستوى', value: userPoint.level, inline: true },
          { name: 'إجمالي الصلوات المسجلة', value: `${totalPrayers}`, inline: true },
          { name: 'إجمالي النقاط', value: `${userPoint.total}`, inline: true },
          { name: 'صلوات اليوم', value: todayNames.length > 0 ? todayNames.join('، ') : 'لا يوجد', inline: true },
        ],
      });

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed('حدث خطأ أثناء جلب نقاط الصلاة.')] });
    }
  },
  category: 'prayer',
} as Command;
