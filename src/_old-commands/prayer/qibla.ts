import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { adhanApi, fetchPrayerTimes } from '../../utils/api';

export default {
  data: new SlashCommandBuilder()
    .setName('قبلة')
    .setDescription('معرفة اتجاه القبلة لمدينة محددة')
    .addStringOption(option =>
      option.setName('المدينة')
        .setDescription('اسم المدينة')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('الدولة')
        .setDescription('اسم الدولة')
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const city = interaction.options.getString('المدينة', true);
    const country = interaction.options.getString('الدولة', true);

    await interaction.deferReply();

    try {
      const prayerData = await fetchPrayerTimes(city, country);
      const { latitude, longitude } = prayerData.meta;

      const { data } = await adhanApi.get(`/qibla/${latitude}/${longitude}`);
      const direction = data.data.direction;

      const directions = [
        'شمال', 'شمال شرقي', 'شرق', 'جنوب شرقي',
        'جنوب', 'جنوب غربي', 'غرب', 'شمال غربي',
      ];
      const index = Math.round(direction / 45) % 8;
      const compassDir = directions[index];

      const embed = buildEmbed('prayer', {
        title: `القبلة • ${city}`,
        description: `الكعبة المشرفة في اتجاه **${direction.toFixed(2)}°** (${compassDir})`,
        fields: [
          { name: 'الإحداثيات', value: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`, inline: true },
          { name: 'الاتجاه', value: `${direction.toFixed(2)}° درجة`, inline: true },
          { name: 'الاتجاه التقريبي', value: compassDir, inline: true },
        ],
        footer: `القبلة • ${city}`,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ embeds: [errorEmbed('تعذر جلب اتجاه القبلة. تأكد من صحة اسم المدينة والدولة.')] });
    }
  },
  category: 'prayer',
} as Command;
