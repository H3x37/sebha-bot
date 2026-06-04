import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import prisma from '../../utils/prisma';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { levels } from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('صليت')
    .setDescription('تسجيل صلاة مفروضة')
    .addStringOption(option =>
      option.setName('الصلاة')
        .setDescription('اختر الصلاة')
        .setRequired(true)
        .addChoices(
          { name: 'الفجر', value: 'الفجر' },
          { name: 'الظهر', value: 'الظهر' },
          { name: 'العصر', value: 'العصر' },
          { name: 'المغرب', value: 'المغرب' },
          { name: 'العشاء', value: 'العشاء' },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    const prayer = interaction.options.getString('الصلاة', true);
    const userId = interaction.user.id;
    const username = interaction.user.username;

    await interaction.deferReply();

    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: { username },
        create: { id: userId, username },
      });

      const lastLog = await prisma.prayerLog.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let currentStreak = 1;

      if (lastLog) {
        const logDate = new Date(lastLog.createdAt);
        logDate.setHours(0, 0, 0, 0);

        if (logDate.getTime() === today.getTime()) {
          const existing = await prisma.userPoint.findUnique({ where: { userId } });
          currentStreak = existing?.streak || 1;
        } else if (logDate.getTime() === yesterday.getTime()) {
          const existing = await prisma.userPoint.findUnique({ where: { userId } });
          currentStreak = (existing?.streak || 0) + 1;
        }
      }

      await prisma.prayerLog.create({
        data: { userId, prayer },
      });

      const POINTS = 10;

      const userPoint = await prisma.userPoint.upsert({
        where: { userId },
        update: {
          prayerPts: { increment: POINTS },
          total: { increment: POINTS },
          streak: currentStreak,
        },
        create: {
          userId,
          prayerPts: POINTS,
          total: POINTS,
          streak: currentStreak,
        },
      });

      const totalPoints = userPoint.total;
      let newLevel = userPoint.level;
      for (let i = levels.length - 1; i >= 0; i--) {
        if (totalPoints >= levels[i].minPoints) {
          newLevel = levels[i].name;
          break;
        }
      }

      if (newLevel !== userPoint.level) {
        await prisma.userPoint.update({
          where: { userId },
          data: { level: newLevel },
        });
      }

      const todayPrayers = await prisma.prayerLog.findMany({
        where: {
          userId,
          createdAt: { gte: today },
        },
        select: { prayer: true },
      });

      const prayedNames = [...new Set(todayPrayers.map(p => p.prayer))];
      const allPrayers = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
      const remaining = allPrayers.filter(p => !prayedNames.includes(p));

      const embed = buildEmbed('prayer', {
        title: `تم تسجيل صلاة ${prayer}`,
        description: `أحسنت! +${POINTS} نقطة`,
        fields: [
          { name: 'نقاط الصلاة', value: `${userPoint.prayerPts}`, inline: true },
          { name: 'السلسلة', value: `${currentStreak} أيام`, inline: true },
          { name: 'المستوى', value: newLevel, inline: true },
          { name: 'صلوات اليوم', value: prayedNames.length > 0 ? prayedNames.join('، ') : '—', inline: false },
          { name: 'المتبقي', value: remaining.length > 0 ? remaining.join('، ') : '✓ جميع الصلوات! 🎉', inline: false },
        ],
      });

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed('حدث خطأ أثناء تسجيل الصلاة.')] });
    }
  },
  category: 'prayer',
} as Command;
