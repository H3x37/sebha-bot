import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';
import { eveningAdhkar } from '../../data/adhkar';

export default {
  data: new SlashCommandBuilder()
    .setName('أذكار-المساء')
    .setDescription('أذكار المساء كاملة'),

  async execute(interaction: ChatInputCommandInteraction) {
    const description = eveningAdhkar.map((a, i) =>
      `${i + 1}. **${a.text}**\n   ⏳ ${a.count} | ✨ ${a.blessing}`
    ).join('\n\n');

    const embed = buildEmbed('adhkar', {
      title: 'أذكار المساء',
      description,
      footer: 'سِبْحَة • فاذكروا الله يذكركم',
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'adhkar',
} as Command;
