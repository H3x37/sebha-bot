import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { localHadith, HadithData } from '../../data/hadith';

const bookNames: Record<string, string> = {
  bukhari: 'صحيح البخاري',
  muslim: 'صحيح مسلم',
  abudawud: 'سنن أبي داود',
  tirmidhi: 'جامع الترمذي',
  nasai: 'سنن النسائي',
  ibnmajah: 'سنن ابن ماجه',
};

const bookKeywords: Record<string, string> = {
  bukhari: 'البخاري',
  muslim: 'مسلم',
  abudawud: 'أبي داود',
  tirmidhi: 'الترمذي',
  nasai: 'النسائي',
  ibnmajah: 'ابن ماجه',
};

export default {
  data: new SlashCommandBuilder()
    .setName('حديث-عشوائي')
    .setDescription('حديث عشوائي من كتاب معين')
    .addStringOption(option =>
      option.setName('الكتاب')
        .setDescription('اختر الكتاب')
        .setRequired(true)
        .addChoices(
          { name: 'صحيح البخاري', value: 'bukhari' },
          { name: 'صحيح مسلم', value: 'muslim' },
          { name: 'سنن أبي داود', value: 'abudawud' },
          { name: 'جامع الترمذي', value: 'tirmidhi' },
          { name: 'سنن النسائي', value: 'nasai' },
          { name: 'سنن ابن ماجه', value: 'ibnmajah' },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    const book = interaction.options.getString('الكتاب', true);
    const keyword = bookKeywords[book];

    const filtered = localHadith.filter(h => h.book.includes(keyword));
    let hadith: HadithData;

    if (filtered.length > 0) {
      hadith = filtered[Math.floor(Math.random() * filtered.length)];
    } else {
      hadith = localHadith[Math.floor(Math.random() * localHadith.length)];
    }

    const embed = buildEmbed('hadith', {
      title: `حديث عشوائي • ${bookNames[book]}`,
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
