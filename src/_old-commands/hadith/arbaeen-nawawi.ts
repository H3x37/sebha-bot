import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import axios from 'axios';

const nawawiHadiths = [
  { number: 1, text: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى', narrator: 'عمر بن الخطاب' },
  { number: 2, text: 'بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمدا رسول الله، وإقام الصلاة، وإيتاء الزكاة، وصوم رمضان، وحج البيت', narrator: 'عبد الله بن عمر' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('الأربعون-النووية')
    .setDescription('عرض حديث من الأربعين النووية')
    .addIntegerOption(option =>
      option.setName('الرقم')
        .setDescription('رقم الحديث (1-42)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(42)),

  async execute(interaction: ChatInputCommandInteraction) {
    const number = interaction.options.getInteger('الرقم', true);

    try {
      const { data: response } = await axios.get(`https://hadith.gading.dev/books/nawawi/${number}`);
      const data = response.data;

      const embed = buildEmbed('hadith', {
        title: `الأربعون النووية - الحديث ${number}`,
        description: data.arab || data.text || nawawiHadiths.find(h => h.number === number)?.text || 'النص غير متوفر',
        fields: [
          { name: 'المصدر', value: 'الأربعون النووية', inline: true },
          { name: 'الراوي', value: data.narrator || nawawiHadiths.find(h => h.number === number)?.narrator || 'غير مذكور', inline: true },
          { name: 'رقم الحديث', value: `${number}`, inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ embeds: [errorEmbed('تعذر جلب الحديث. حاول مرة أخرى.')] });
    }
  },
  category: 'hadith',
} as Command;
