import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';

export default {
  data: new SlashCommandBuilder()
    .setName('بنق')
    .setDescription('اختبار البوت - ping'),

  async execute(interaction: ChatInputCommandInteraction) {
    const ping = interaction.client.ws.ping;
    const embed = buildEmbed('default', {
      title: 'بونق!',
      description: `🟢 البوت يعمل!\n⏱️ البنق: **${ping}ms**`,
    });
    await interaction.reply({ embeds: [embed] });
  },
  category: 'settings',
} as Command;
