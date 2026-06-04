import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { topicHadith, HadithData } from '../../data/hadith';

const topicLabels: Record<string, string> = {
  الصيام: 'الصيام',
  الصلاة: 'الصلاة',
  الأخلاق: 'الأخلاق',
  الزكاة: 'الزكاة',
  الحج: 'الحج',
  الذكر: 'الذكر',
};

export default {
  data: new SlashCommandBuilder()
    .setName('أحاديث')
    .setDescription('أحاديث عن موضوع معين')
    .addStringOption(option =>
      option.setName('الموضوع')
        .setDescription('اختر الموضوع')
        .setRequired(true)
        .addChoices(
          { name: 'الصيام', value: 'الصيام' },
          { name: 'الصلاة', value: 'الصلاة' },
          { name: 'الأخلاق', value: 'الأخلاق' },
          { name: 'الزكاة', value: 'الزكاة' },
          { name: 'الحج', value: 'الحج' },
          { name: 'الذكر', value: 'الذكر' },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    const topic = interaction.options.getString('الموضوع', true);
    const hadiths = topicHadith[topic];

    if (!hadiths || hadiths.length === 0) {
      await interaction.reply({ embeds: [errorEmbed(`لم يتم العثور على أحاديث عن "${topicLabels[topic]}".`)] });
      return;
    }

    const description = hadiths.map((h, i) =>
      `**${i + 1}.** ${h.arab}\n*${h.book} — ${h.narrator} (${h.grade})*`
    ).join('\n\n');

    const embed = buildEmbed('hadith', {
      title: `أحاديث عن ${topicLabels[topic]}`,
      description,
      fields: [
        { name: 'عدد الأحاديث', value: `${hadiths.length}`, inline: true },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'hadith',
} as Command;
