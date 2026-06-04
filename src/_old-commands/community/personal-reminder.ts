import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const typeLabels: Record<string, string> = {
  'أذكار-صباح': '🟢 أذكار الصباح',
  'أذكار-مساء': '🟣 أذكار المساء',
  'صلاة': '🕌 صلاة',
  'قرآن': '📖 قرآن',
  'ذكر-محدد': '🫶 ذكر محدد',
};

export default {
  data: new SlashCommandBuilder()
    .setName('تذكير-شخصي')
    .setDescription('ضبط تذكير شخصي')
    .addStringOption(option =>
      option.setName('النوع')
        .setDescription('نوع التذكير')
        .setRequired(true)
        .addChoices(
          { name: 'أذكار الصباح', value: 'أذكار-صباح' },
          { name: 'أذكار المساء', value: 'أذكار-مساء' },
          { name: 'صلاة', value: 'صلاة' },
          { name: 'قرآن', value: 'قرآن' },
          { name: 'ذكر محدد', value: 'ذكر-محدد' },
        ))
    .addStringOption(option =>
      option.setName('الوقت')
        .setDescription('الوقت بصيغة HH:MM (مثال: 06:00)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('العنوان')
        .setDescription('عنوان إضافي للتذكير (اختياري)')
        .setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const type = interaction.options.getString('النوع', true);
    const time = interaction.options.getString('الوقت', true);
    const title = interaction.options.getString('العنوان');

    if (!timeRegex.test(time)) {
      await interaction.reply({
        embeds: [errorEmbed('صيغة الوقت غير صحيحة! استخدم صيغة HH:MM (مثال: 06:00)')],
        flags: 64,
      });
      return;
    }

    await prisma.user.upsert({
      where: { id: userId },
      update: { username: interaction.user.username },
      create: { id: userId, username: interaction.user.username },
    });

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        type,
        title: title || typeLabels[type] || type,
        time,
      },
    });

    const embed = buildEmbed('community', {
      title: 'تم ضبط التذكير',
      fields: [
        { name: 'النوع', value: typeLabels[type] || type, inline: true },
        { name: 'الوقت', value: time, inline: true },
        { name: 'العنوان', value: reminder.title, inline: false },
        { name: 'المعرف', value: `\`${reminder.id}\``, inline: false },
      ],
      footer: 'سيتم تذكيرك يومياً في الوقت المحدد إن شاء الله',
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'community',
} as Command;
