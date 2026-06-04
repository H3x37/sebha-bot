import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { fetchHadithRandom } from '../../utils/api';
import { getRandomHadith, HadithData } from '../../data/hadith';

export default {
  data: new SlashCommandBuilder()
    .setName('حديث-اليوم')
    .setDescription('حديث عشوائي من السنة النبوية'),

  async execute(interaction: ChatInputCommandInteraction) {
    let hadith: HadithData;

    try {
      const data = await fetchHadithRandom();
      if (data?.arab) {
        hadith = {
          number: data.number || 0,
          arab: data.arab || data.contents?.ar || '',
          narrator: data.narrator || 'غير مذكور',
          book: data.book?.name || 'غير معروف',
          grade: data.grade?.name || data.available || '—',
        };
      } else {
        hadith = getRandomHadith();
      }
    } catch {
      hadith = getRandomHadith();
    }

    const embed = buildEmbed('hadith', {
      title: 'حديث اليوم',
      description: `━─━─━─━─━─━─━─━─━\n${hadith.arab}\n━─━─━─━─━─━─━─━─━`,
      fields: [
        { name: 'المصدر', value: hadith.book, inline: true },
        { name: 'الراوي', value: hadith.narrator, inline: true },
        { name: 'الحكم', value: hadith.grade, inline: true },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'hadith',
} as Command;
