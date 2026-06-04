import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { searchQuran } from '../../utils/api';

export default {
  data: new SlashCommandBuilder()
    .setName('\u0628\u062D\u062B-\u0642\u0631\u0622\u0646')
    .setDescription('\u0627\u0644\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645')
    .addStringOption(option =>
      option.setName('\u0643\u0644\u0645\u0629')
        .setDescription('\u0627\u0644\u0643\u0644\u0645\u0629 \u0623\u0648 \u0627\u0644\u0639\u0628\u0627\u0631\u0629 \u0644\u0644\u0628\u062D\u062B')
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('\u0643\u0644\u0645\u0629', true);

    try {
      const data = await searchQuran(query);

      if (!data.matches || data.matches.length === 0) {
        await interaction.reply({ embeds: [errorEmbed('\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0646\u062A\u0627\u0626\u062C \u0644\u0640 "' + query + '".')] });
        return;
      }

      const total = data.matches.length;
      const results = data.matches.slice(0, 10);
      const description = results.map((m: any, i: number) =>
        '**' + (i + 1) + '.** \u0633\u0648\u0631\u0629 ' + m.surah.name + ' (' + m.numberInSurah + ')\n' + m.text
      ).join('\n\n');

      const embed = buildEmbed('quran', {
        title: '\u0646\u062A\u0627\u0626\u062C \u0627\u0644\u0628\u062D\u062B \u0639\u0646: ' + query,
        description,
        fields: [
          { name: 'عدد النتائج', value: '' + total, inline: true },
          { name: 'النتائج المعروضة', value: Math.min(total, 10) + ' من ' + total, inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0628\u062D\u062B. \u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.')] });
    }
  },
  category: 'quran',
} as Command;
