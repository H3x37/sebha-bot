import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { localHadith } from '../../data/hadith';

function normalize(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

export default {
  data: new SlashCommandBuilder()
    .setName('بحث-حديث')
    .setDescription('البحث عن حديث بكلمة مفتاحية')
    .addStringOption(option =>
      option.setName('كلمة')
        .setDescription('الكلمة أو العبارة للبحث')
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('كلمة', true);
    const normalizedQuery = normalize(query);

    const results = localHadith.filter(h => normalize(h.arab).includes(normalizedQuery));

    if (results.length === 0) {
      await interaction.reply({ embeds: [errorEmbed(`لم يتم العثور على نتائج لـ "${query}".`)] });
      return;
    }

    const shown = results.slice(0, 5);
    const description = shown.map((h, i) =>
      `**${i + 1}.** ${h.arab}\n*${h.book} — ${h.narrator} (${h.grade})*`
    ).join('\n\n');

    const embed = buildEmbed('hadith', {
      title: `نتائج البحث عن: ${query}`,
      description,
      fields: [
        { name: 'عدد النتائج المعروضة', value: `${shown.length} من ${results.length}`, inline: true },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'hadith',
} as Command;
