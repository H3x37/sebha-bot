import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

export default {
  data: new SlashCommandBuilder()
    .setName('ضبط-أذكار')
    .setDescription('ضبط إعدادات الأذكار في السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('الروم')
        .setDescription('الروم المخصص للأذكار')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('وقت-الصباح')
        .setDescription('وقت أذكار الصباح (HH:MM) - بصيغة 24 ساعة'))
    .addStringOption(option =>
      option.setName('وقت-المساء')
        .setDescription('وقت أذكار المساء (HH:MM) - بصيغة 24 ساعة'))
    .addRoleOption(option =>
      option.setName('رول-التنبيه')
        .setDescription('الرول الذي يتم منشنهم عند الأذكار')),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
      return;
    }

    const channel = interaction.options.getChannel('الروم', true);
    const morningTime = interaction.options.getString('وقت-الصباح') || '06:00';
    const eveningTime = interaction.options.getString('وقت-المساء') || '18:00';
    const role = interaction.options.getRole('رول-التنبيه');

    await prisma.guild.upsert({
      where: { id: interaction.guildId },
      update: {},
      create: { id: interaction.guildId, name: interaction.guild?.name || '' },
    });

    await prisma.guildSetting.upsert({
      where: { guildId: interaction.guildId },
      update: {
        adhkarChannel: channel.id,
        adhkarRole: role?.id || null,
        adhkarMorning: morningTime,
        adhkarEvening: eveningTime,
      },
      create: {
        guildId: interaction.guildId,
        adhkarChannel: channel.id,
        adhkarRole: role?.id || null,
        adhkarMorning: morningTime,
        adhkarEvening: eveningTime,
      },
    });

    const embed = buildEmbed('settings', {
      title: 'تم ضبط الأذكار',
      fields: [
        { name: 'الروم', value: `${channel}`, inline: true },
        { name: 'وقت الصباح', value: morningTime, inline: true },
        { name: 'وقت المساء', value: eveningTime, inline: true },
        { name: 'رول التنبيه', value: role ? `${role}` : 'بدون', inline: true },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'adhkar',
} as Command;
