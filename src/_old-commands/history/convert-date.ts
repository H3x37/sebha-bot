import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import axios from 'axios';

interface ConvertedData {
  date: string;
  day: string;
  month: {
    number: number;
    en: string;
    ar: string;
  };
  year: string;
}

interface ConversionResponse {
  code: number;
  status: string;
  data: {
    gregorian?: ConvertedData;
    hijri?: ConvertedData;
  };
}

function validateDate(day: number, month: number, year: number, toHijri: boolean): string | null {
  if (day < 1 || day > 31) return 'اليوم يجب أن يكون بين 1 و 31';
  if (month < 1 || month > 12) return 'الشهر يجب أن يكون بين 1 و 12';

  if (toHijri) {
    if (year < 1900 || year > 2100) return 'السنة الميلادية يجب أن تكون بين 1900 و 2100';
  } else {
    if (year < 1 || year > 1500) return 'السنة الهجرية يجب أن تكون بين 1 و 1500';
  }

  return null;
}

export default {
  data: new SlashCommandBuilder()
    .setName('تحويل-تاريخ')
    .setDescription('تحويل التاريخ بين الهجري والميلادي')
    .addIntegerOption(option =>
      option.setName('اليوم')
        .setDescription('اليوم (1-31)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(31))
    .addIntegerOption(option =>
      option.setName('الشهر')
        .setDescription('الشهر (1-12)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12))
    .addIntegerOption(option =>
      option.setName('السنة')
        .setDescription('السنة')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('إلى')
        .setDescription('تحويل إلى')
        .setRequired(true)
        .addChoices(
          { name: 'هجري', value: 'هجري' },
          { name: 'ميلادي', value: 'ميلادي' },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const day = interaction.options.getInteger('اليوم', true);
    const month = interaction.options.getInteger('الشهر', true);
    const year = interaction.options.getInteger('السنة', true);
    const toType = interaction.options.getString('إلى', true);

    const toHijri = toType === 'هجري';

    const validationError = validateDate(day, month, year, toHijri);
    if (validationError) {
      await interaction.editReply({ embeds: [errorEmbed(validationError)] });
      return;
    }

    try {
      const formattedDay = String(day).padStart(2, '0');
      const formattedMonth = String(month).padStart(2, '0');

      let apiUrl: string;
      if (toHijri) {
        apiUrl = `https://api.aladhan.com/v1/gToH?date=${formattedDay}-${formattedMonth}-${year}`;
      } else {
        apiUrl = `https://api.aladhan.com/v1/hToG?date=${formattedDay}-${formattedMonth}-${year}`;
      }

      const { data: response } = await axios.get<ConversionResponse>(apiUrl);

      if (response.code !== 200) {
        throw new Error('API returned non-200 code');
      }

      let resultText: string;
      let title: string;

      if (toHijri) {
        const hijri = response.data.hijri!;
        resultText = `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
        title = 'تحويل التاريخ - ميلادي → هجري';
      } else {
        const gregorian = response.data.gregorian!;
        resultText = `${gregorian.day} ${gregorian.month.ar} ${gregorian.year} م`;
        title = 'تحويل التاريخ - هجري → ميلادي';
      }

      const inputText = toHijri
        ? `${formattedDay}/${formattedMonth}/${year} م`
        : `${formattedDay}/${formattedMonth}/${year} هـ`;

      const embed = buildEmbed('history', {
        title,
        fields: [
          { name: 'التاريخ المدخل', value: inputText, inline: true },
          { name: 'النتيجة', value: resultText, inline: true },
        ],
      });

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({
        embeds: [errorEmbed('تعذر تحويل التاريخ. تأكد من صحة البيانات المدخلة وحاول مرة أخرى.')],
      });
    }
  },
  category: 'history',
} as Command;
