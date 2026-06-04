import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { Command } from '../../types';
import prisma from '../../utils/prisma';
import { buildEmbed, errorEmbed } from '../../utils/embed';

export default {
  data: new SlashCommandBuilder()
    .setName('إعداد-أذان')
    .setDescription('إعداد قناة الأذان لمدينة محددة')
    .addChannelOption(option =>
      option.setName('الروم')
        .setDescription('القناة المخصصة للأذان')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .addStringOption(option =>
      option.setName('المدينة')
        .setDescription('اسم المدينة')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('الدولة')
        .setDescription('اسم الدولة')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
      return;
    }

    const channel = interaction.options.getChannel('الروم', true);
    const city = interaction.options.getString('المدينة', true);
    const country = interaction.options.getString('الدولة', true);

    await prisma.guild.upsert({
      where: { id: interaction.guildId },
      update: {},
      create: { id: interaction.guildId, name: interaction.guild?.name || '' },
    });

    await prisma.prayerSetting.upsert({
      where: { guildId_channel: { guildId: interaction.guildId, channel: channel.id } },
      update: { city, country },
      create: { guildId: interaction.guildId, channel: channel.id, city, country },
    });

    const embed = buildEmbed('prayer', {
      title: 'تم إعداد الأذان',
      fields: [
        { name: 'القناة', value: `${channel}`, inline: true },
        { name: 'المدينة', value: city, inline: true },
        { name: 'الدولة', value: country, inline: true },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'prayer',
} as Command;
