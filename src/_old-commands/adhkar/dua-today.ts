import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';
import { duaToday } from '../../data/adhkar';

export default {
  data: new SlashCommandBuilder()
    .setName('دعاء-اليوم')
    .setDescription('دعاء مقترح لهذا اليوم'),

  async execute(interaction: ChatInputCommandInteraction) {
    const index = new Date().getDate() % duaToday.length;
    const dua = duaToday[index];

    const embed = buildEmbed('adhkar', {
      title: 'دعاء اليوم',
      description: `**${dua.text}**`,
      fields: [
        { name: 'الفضل', value: dua.blessing, inline: false },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'adhkar',
} as Command;
