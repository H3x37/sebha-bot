import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

export default {
  data: new SlashCommandBuilder()
    .setName('لغة')
    .setDescription('تغيير لغة البوت')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('اللغة')
        .setDescription('اختر اللغة')
        .setRequired(true)
        .addChoices(
          { name: 'العربية', value: 'ar' },
          { name: 'English', value: 'en' },
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
      return;
    }

    const lang = interaction.options.getString('اللغة', true);

    await prisma.guild.upsert({
      where: { id: interaction.guildId },
      update: { lang },
      create: { id: interaction.guildId, name: interaction.guild?.name || '', lang },
    });

    const msg = lang === 'en'
      ? 'Language has been set to **English**'
      : 'تم تعيين اللغة إلى **العربية**';

    const embed = buildEmbed('settings', {
      title: 'تم تغيير اللغة',
      description: msg,
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'settings',
} as Command;
