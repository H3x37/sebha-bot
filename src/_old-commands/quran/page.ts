import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { fetchQuranPage } from '../../utils/api';

export default {
  data: new SlashCommandBuilder()
    .setName('صفحة')
    .setDescription('عرض صفحة من المصحف')
    .addIntegerOption(option =>
      option.setName('رقم')
        .setDescription('رقم الصفحة (1-604)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(604)),

  async execute(interaction: ChatInputCommandInteraction) {
    const pageNum = interaction.options.getInteger('رقم', true);

    try {
      const data = await fetchQuranPage(pageNum);

      const ayahs = data.ayahs.slice(0, 15);
      const description = ayahs.map((a: any) => {
        const surahName = a.surah.name;
        return `**${surahName} (${a.numberInSurah})** ${a.text}`;
      }).join('\n\n');

      const embed = buildEmbed('quran', {
        title: `الصفحة ${data.number}`,
        description,
        fields: [
          { name: 'عدد الآيات المعروضة', value: `${ayahs.length}`, inline: true },
          { name: 'عدد آيات الصفحة', value: `${data.ayahs.length}`, inline: true },
        ],
        footer: `الصفحة ${data.number}`,
      });

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('لم يتم العثور على الصفحة. تأكد من أن الرقم بين 1 و 604.')] });
    }
  },
  category: 'quran',
} as Command;
