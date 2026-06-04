import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { quranApi } from '../../utils/api';

export default {
  data: new SlashCommandBuilder()
    .setName('آيات')
    .setDescription('عرض مجموعة آيات من سورة معينة')
    .addIntegerOption(option =>
      option.setName('السورة')
        .setDescription('رقم السورة (1-114)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(114))
    .addIntegerOption(option =>
      option.setName('من')
        .setDescription('رقم البداية')
        .setRequired(true)
        .setMinValue(1))
    .addIntegerOption(option =>
      option.setName('إلى')
        .setDescription('رقم النهاية')
        .setRequired(true)
        .setMinValue(1)),

  async execute(interaction: ChatInputCommandInteraction) {
    const surah = interaction.options.getInteger('السورة', true);
    const from = interaction.options.getInteger('من', true);
    const to = interaction.options.getInteger('إلى', true);

    if (from > to) {
      await interaction.reply({ embeds: [errorEmbed('رقم البداية يجب أن يكون أقل أو يساوي رقم النهاية.')] });
      return;
    }

    if (to - from > 50) {
      await interaction.reply({ embeds: [errorEmbed('الحد الأقصى للمدى هو 50 آية.')] });
      return;
    }

    try {
      const { data } = await quranApi.get(`/surah/${surah}`);
      const surahData = data.data;

      const ayahs = surahData.ayahs.filter(
        (a: any) => a.numberInSurah >= from && a.numberInSurah <= to
      );

      if (ayahs.length === 0) {
        await interaction.reply({ embeds: [errorEmbed('لم يتم العثور على آيات في هذا النطاق.')] });
        return;
      }

      const description = ayahs.map((a: any) =>
        `**(${a.numberInSurah})** ${a.text}`
      ).join('\n\n');

      const embed = buildEmbed('quran', {
        title: `سورة ${surahData.name} - الآيات ${from}-${to}`,
        description,
        fields: [
          { name: 'عدد الآيات', value: `${ayahs.length}`, inline: true },
          { name: 'نوع الوحي', value: surahData.revelationType === 'Meccan' ? 'مكية' : 'مدنية', inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('حدث خطأ أثناء جلب الآيات. تأكد من رقم السورة.')] });
    }
  },
  category: 'quran',
} as Command;
