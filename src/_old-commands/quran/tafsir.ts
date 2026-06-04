import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { fetchQuranVerse, quranApi } from '../../utils/api';

export default {
  data: new SlashCommandBuilder()
    .setName('تفسير')
    .setDescription('تفسير آية من القرآن الكريم')
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
      const verseData = await fetchQuranVerse(surah, ayah);
      let tafsirText = '';

      try {
        const { data } = await quranApi.get(`/ayah/${surah}:${ayah}/ar.muyassar`);
        tafsirText = data.data.text;
      } catch {
        tafsirText = 'التفسير غير متاح لهذه الآية حالياً.';
      }

      const embed = buildEmbed('quran', {
        title: `تفسير سورة ${verseData.surah.name} - الآية ${verseData.numberInSurah}`,
        description: `**الآية:**\n${verseData.text}\n\n**التفسير:**\n${tafsirText}`,
        fields: [
          { name: 'الجزء', value: `${verseData.juz}`, inline: true },
          { name: 'الصفحة', value: `${verseData.page}`, inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('لم يتم العثور على الآية أو تفسيرها. تأكد من رقم السورة والآية.')] });
    }
  },
  category: 'quran',
} as Command;
