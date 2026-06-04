import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

export default {
  data: new SlashCommandBuilder()
    .setName('ختمة')
    .setDescription('إدارة الختمة الجماعية')
    .addStringOption(option =>
      option.setName('تسجيل')
        .setDescription('اختر العملية')
        .setRequired(true)
        .addChoices(
          { name: 'انضمام', value: 'join' },
          { name: 'تقدم', value: 'progress' },
          { name: 'حالتي', value: 'mystatus' },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    const action = interaction.options.getString('تسجيل', true);

    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات.')], flags: 64 });
      return;
    }

    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    try {
      await prisma.guild.upsert({
        where: { id: guildId },
        update: { name: interaction.guild?.name || '' },
        create: { id: guildId, name: interaction.guild?.name || '' },
      });

      await prisma.user.upsert({
        where: { id: userId },
        update: { username: interaction.user.username },
        create: { id: userId, username: interaction.user.username },
      });

      if (action === 'join') {
        await prisma.khatmaParticipant.upsert({
          where: { guildId_userId: { guildId, userId } },
          update: {},
          create: { guildId, userId },
        });

        await prisma.khatmaProgress.upsert({
          where: { userId_guildId: { userId, guildId } },
          update: {},
          create: { userId, guildId, juz: 1, page: 1 },
        });

        const embed = buildEmbed('quran', {
          title: 'تم الانضمام إلى الختمة',
          description: `مرحباً بك في الختمة الجماعية في سيرفر **${interaction.guild?.name}**!\n\nاستخدم \`/ختمة-تقدم\` لتسجيل تقدمك.`,
        });

        await interaction.reply({ embeds: [embed] });
      } else if (action === 'progress') {
        const participants = await prisma.khatmaParticipant.findMany({
          where: { guildId },
          include: { guild: true },
        });

        if (participants.length === 0) {
          await interaction.reply({ embeds: [errorEmbed('لا يوجد مشاركون في الختمة بعد. انضم باستخدام \`/ختمة انضمام\`.')] });
          return;
        }

        const totalJuz = 30;
        const submittedJuz = new Set<number>();
        for (const p of participants) {
          const juzList = p.juz ? p.juz.split(',').filter(Boolean).map(Number) : [];
          juzList.forEach(j => submittedJuz.add(j));
        }
        const completedCount = submittedJuz.size;
        const progressPercent = Math.round((completedCount / totalJuz) * 100);

        const participantList = participants.map(p => {
          const juzList = p.juz ? p.juz.split(',').filter(Boolean).map(Number) : [];
          return `<@${p.userId}> - ${juzList.length} أجزاء`;
        }).join('\n') || 'لا يوجد';

        const embed = buildEmbed('quran', {
          title: `تقدم الختمة - ${interaction.guild?.name}`,
          description: `**تم إكمال ${completedCount} من ${totalJuz} جزء (${progressPercent}%)**`,
          fields: [
            { name: 'عدد المشاركين', value: `${participants.length}`, inline: true },
            { name: 'الأجزاء المنجزة', value: `${completedCount} / ${totalJuz}`, inline: true },
            { name: 'المشاركون', value: participantList },
          ],
        });

        await interaction.reply({ embeds: [embed] });
      } else if (action === 'mystatus') {
        const progress = await prisma.khatmaProgress.findUnique({
          where: { userId_guildId: { userId, guildId } },
        });

        const participant = await prisma.khatmaParticipant.findUnique({
          where: { guildId_userId: { guildId, userId } },
        });

        if (!participant) {
          await interaction.reply({ embeds: [errorEmbed('أنت لست مشتركاً في الختمة. استخدم \`/ختمة انضمام\` للانضمام.')] });
          return;
        }

        const currentJuz = progress?.juz || 1;
        const currentPage = progress?.page || 1;
        const completedJuzList = participant.juz ? participant.juz.split(',').filter(Boolean).map(Number) : [];
        const completedJuzCount = completedJuzList.length;

        const embed = buildEmbed('quran', {
          title: 'حالتي في الختمة',
          fields: [
            { name: 'الجزء الحالي', value: `${currentJuz}`, inline: true },
            { name: 'الصفحة الحالية', value: `${currentPage}`, inline: true },
            { name: 'الأجزاء المنجزة', value: `${completedJuzCount} / 30`, inline: true },
            { name: 'الأجزاء المسجلة', value: completedJuzCount > 0 ? completedJuzList.join('، ') : 'لا يوجد', inline: false },
          ],
        });

        await interaction.reply({ embeds: [embed] });
      }
    } catch {
      await interaction.reply({ embeds: [errorEmbed('حدث خطأ أثناء تنفيذ العملية. حاول مرة أخرى.')] });
    }
  },
  category: 'quran',
} as Command;
