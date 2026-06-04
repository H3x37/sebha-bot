import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';
import { morningAdhkar } from '../../data/adhkar';

export default {
  data: new SlashCommandBuilder()
    .setName('أذكار-الصباح')
    .setDescription('أذكار الصباح كاملة'),

  async execute(interaction: ChatInputCommandInteraction) {
    const description = morningAdhkar.map((a, i) =>
      `${i + 1}. **${a.text}**\n   ⏳ ${a.count} | ✨ ${a.blessing}`
    ).join('\n\n');

    const embed = buildEmbed('adhkar', {
      title: 'أذكار الصباح',
      description,
      footer: 'سِبْحَة • فاذكروا الله يذكركم',
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'adhkar',
} as Command;
