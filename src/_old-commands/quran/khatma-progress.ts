import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

export default {
  data: new SlashCommandBuilder()
    .setName('ختمة-تقدم')
    .setDescription('تسجيل تقدمك في الختمة')
    .addIntegerOption(option =>
      option.setName('الجزء')
        .setDescription('رقم الجزء الحالي (1-30)')
        .setMinValue(1)
        .setMaxValue(30))
    .addIntegerOption(option =>
      option.setName('الصفحة')
        .setDescription('رقم الصفحة الحالية (1-604)')
        .setMinValue(1)
        .setMaxValue(604)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات.')], flags: 64 });
      return;
    }

    const userId = interaction.user.id;
    const guildId = interaction.guildId;
    const juz = interaction.options.getInteger('الجزء');
    const page = interaction.options.getInteger('الصفحة');

    if (!juz && !page) {
      await interaction.reply({ embeds: [errorEmbed('يرجى تحديد رقم الجزء أو رقم الصفحة على الأقل.')] });
      return;
    }

    try {
      const participant = await prisma.khatmaParticipant.findUnique({
        where: { guildId_userId: { guildId, userId } },
      });

      if (!participant) {
        await interaction.reply({ embeds: [errorEmbed('يجب الانضمام إلى الختمة أولاً باستخدام \`/ختمة انضمام\`.')] });
        return;
      }

      const updateData: { juz?: number; page?: number } = {};
      if (juz) updateData.juz = juz;
      if (page) updateData.page = page;

      const updated = await prisma.khatmaProgress.upsert({
        where: { userId_guildId: { userId, guildId } },
        update: updateData,
        create: {
          userId,
          guildId,
          juz: juz || 1,
          page: page || 1,
        },
      });

      const parsedJuz = participant.juz ? participant.juz.split(',').filter(Boolean).map(Number) : [];
      let completedJuz = parsedJuz;
      if (juz && !completedJuz.includes(juz)) {
        completedJuz = [...completedJuz, juz].sort((a, b) => a - b);
        await prisma.khatmaParticipant.update({
          where: { guildId_userId: { guildId, userId } },
          data: { juz: completedJuz.join(',') },
        });
      }

      const embed = buildEmbed('quran', {
        title: 'تم تحديث التقدم',
        fields: [
          { name: 'الجزء', value: `${updated.juz}`, inline: true },
          { name: 'الصفحة', value: `${updated.page}`, inline: true },
          { name: 'الأجزاء المنجزة', value: `${completedJuz.length} / 30`, inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('حدث خطأ أثناء تحديث التقدم. حاول مرة أخرى.')] });
    }
  },
  category: 'quran',
} as Command;
