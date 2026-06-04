import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { fetchQuranVerse } from '../../utils/api';

export default {
  data: new SlashCommandBuilder()
    .setName('آية-يومية')
    .setDescription('آية عشوائية من القرآن الكريم'),

  async execute(interaction: ChatInputCommandInteraction) {
    const surahsWithThreeOrMore = Array.from({ length: 114 }, (_, i) => i + 1);

    const tryFetch = async (): Promise<any> => {
      const surah = surahsWithThreeOrMore[Math.floor(Math.random() * surahsWithThreeOrMore.length)];
      const ayah = Math.floor(Math.random() * 3) + 1;
      return fetchQuranVerse(surah, ayah);
    };

    let data: any;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        data = await tryFetch();
        break;
      } catch {
        if (attempt === 4) {
          await interaction.reply({ embeds: [errorEmbed('تعذر جلب آية اليوم. حاول مرة أخرى لاحقاً.')] });
          return;
        }
      }
    }

    const embed = buildEmbed('quran', {
        title: `آية اليوم - سورة ${data.surah.name} (${data.numberInSurah})`,
      description: data.text,
      fields: [
        { name: 'الجزء', value: `${data.juz}`, inline: true },
        { name: 'الصفحة', value: `${data.page}`, inline: true },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'quran',
} as Command;
