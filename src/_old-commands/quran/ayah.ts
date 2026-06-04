import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { fetchQuranVerse } from '../../utils/api';

export default {
  data: new SlashCommandBuilder()
    .setName('آية')
    .setDescription('عرض آية قرآنية')
    .addIntegerOption(option =>
      option.setName('السورة')
        .setDescription('رقم السورة (1-114)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(114))
    .addIntegerOption(option =>
      option.setName('الآية')
        .setDescription('رقم الآية')
        .setRequired(true)
        .setMinValue(1)),

  async execute(interaction: ChatInputCommandInteraction) {
    const surah = interaction.options.getInteger('السورة', true);
    const ayah = interaction.options.getInteger('الآية', true);

    try {
      const data = await fetchQuranVerse(surah, ayah);

      const embed = buildEmbed('quran', {
        title: `سورة ${data.surah.name} - الآية ${data.numberInSurah}`,
        description: data.text,
        fields: [
          { name: 'الجزء', value: `${data.juz}`, inline: true },
          { name: 'الصفحة', value: `${data.page}`, inline: true },
          { name: 'الحزب', value: `${data.hizbQuarter}`, inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('لم يتم العثور على الآية. تأكد من رقم السورة والآية.')] });
    }
  },
  category: 'quran',
} as Command;
