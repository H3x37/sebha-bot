import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { fetchPrayerTimes } from '../../utils/api';

const prayerNames: Record<string, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

const prayerEmojis: Record<string, string> = {
  Fajr: '🌙',
  Sunrise: '🌅',
  Dhuhr: '☀️',
  Asr: '🌤️',
  Maghrib: '🌇',
  Isha: '🌃',
};

export default {
  data: new SlashCommandBuilder()
    .setName('أوقات-صلاة')
    .setDescription('عرض أوقات الصلاة لمدينة محددة')
    .addStringOption(option =>
      option.setName('المدينة')
        .setDescription('اسم المدينة')
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const city = interaction.options.getString('المدينة', true);

    await interaction.deferReply();

    try {
      const data = await fetchPrayerTimes(city, city);
      const timings = data.timings;
      const hijri = data.date.hijri;

      const hijriMonthName = hijri.month.ar || hijri.month.en;

      const fields = Object.entries(prayerNames).map(([key, name]) => ({
        name: `${prayerEmojis[key]} ${name}`,
        value: `**${timings[key]}**`,
        inline: true,
      }));

      const embed = buildEmbed('prayer', {
        title: `أوقات الصلاة • ${city}`,
        fields,
        footer: `${hijri.day} ${hijriMonthName} ${hijri.year}هـ • ${data.date.readable}`,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed('تعذر جلب أوقات الصلاة. تأكد من صحة اسم المدينة.')] });
    }
  },
  category: 'prayer',
} as Command;
