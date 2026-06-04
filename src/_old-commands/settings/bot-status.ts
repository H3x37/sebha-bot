import { SlashCommandBuilder, ChatInputCommandInteraction, version as djsVersion } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';
import { config } from '../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('حالة-البوت')
    .setDescription('عرض حالة البوت'),

  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    const uptime = Math.floor(client.uptime / 1000);
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const commandCount = client.application?.commands
      ? (await client.application.commands.fetch()).size
      : 0;

    const embed = buildEmbed('settings', {
      title: 'حالة البوت',
      fields: [
        { name: 'النسخة', value: config.version, inline: true },
        { name: 'Discord.js', value: djsVersion, inline: true },
        { name: 'البنج', value: `${client.ws.ping}ms`, inline: true },
        { name: 'السيرفرات', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'الأوامر', value: `${commandCount}`, inline: true },
        {
          name: 'مدة التشغيل',
          value: `${days}ي ${hours}س ${minutes}د ${seconds}ث`,
          inline: true,
        },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'settings',
} as Command;
