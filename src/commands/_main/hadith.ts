import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { blockquote, bold } from '../../utils/format';
import { fetchHadithRandom } from '../../utils/api';
import { getRandomHadith, localHadith, topicHadith, HadithData } from '../../data/hadith';
import axios from 'axios';

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

function normalize(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

const nawawiHadiths = [
  { number: 1, text: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى', narrator: 'عمر بن الخطاب' },
  { number: 2, text: 'بني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمدا رسول الله، وإقام الصلاة، وإيتاء الزكاة، وصوم رمضان، وحج البيت', narrator: 'عبد الله بن عمر' },
  { number: 3, text: 'عَنْ أَبِي عَبْدِ الرَّحْمَنِ عَبْدِ اللَّهِ بْنِ مَسْعُودٍ رَضِيَ اللَّهُ عَنْهُ قَالَ: حَدَّثَنَا رَسُولُ اللَّهِ ﷺ وَهُوَ الصَّادِقُ الْمَصْدُوقُ: إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ أَرْبَعِينَ يَوْمًا نُطْفَةً...', narrator: 'ابن مسعود' },
  { number: 4, text: 'عَنْ أُمِّ الْمُؤْمِنِينَ أُمِّ عَبْدِ اللَّهِ عَائِشَةَ رَضِيَ اللَّهُ عَنْهَا قَالَتْ: قَالَ رَسُولُ اللَّهِ ﷺ: مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ', narrator: 'عائشة' },
  { number: 5, text: 'عَنْ أَبِي عَبْدِ اللَّهِ النُّعْمَانِ بْنِ بَشِيرٍ رَضِيَ اللَّهُ عَنْهُمَا قَالَ: سَمِعْتُ رَسُولَ اللَّهِ ﷺ يَقُولُ: إِنَّ الْحَلَالَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ، وَبَيْنَهُمَا مُشْتَبِهَاتٌ لَا يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ...', narrator: 'النعمان بن بشير' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('حديث')
    .setDescription('أوامر الأحاديث النبوية')
    .addSubcommand(sub =>
      sub.setName('اليوم')
        .setDescription('حديث اليوم'))
    .addSubcommand(sub =>
      sub.setName('عشوائي')
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
            )))
    .addSubcommand(sub =>
      sub.setName('بحث')
        .setDescription('البحث عن حديث بكلمة مفتاحية')
        .addStringOption(option =>
          option.setName('كلمة')
            .setDescription('الكلمة أو العبارة للبحث')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('أحاديث')
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
            )))
    .addSubcommand(sub =>
      sub.setName('الأربعون-النووية')
        .setDescription('عرض حديث من الأربعين النووية')
        .addIntegerOption(option =>
          option.setName('الرقم')
            .setDescription('رقم الحديث (1-42)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(42))),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'اليوم') {
      let hadith: HadithData;

      try {
        const data = await fetchHadithRandom();
        if (data?.arab) {
          hadith = {
            number: data.number || 0,
            arab: data.arab || '',
            narrator: data.narrator || 'غير مذكور',
            book: data.book?.name || 'غير معروف',
            grade: data.grade?.name || '—',
          };
        } else {
          hadith = getRandomHadith();
        }
      } catch {
        hadith = getRandomHadith();
      }

      const embed = buildEmbed('hadith', {
        author: 'الحديث النبوي الشريف',
        title: 'حديث اليوم',
        description: blockquote(hadith.arab),
        fields: [
          { name: bold('المصدر'), value: hadith.book, inline: true },
          { name: bold('الراوي'), value: hadith.narrator, inline: true },
          { name: bold('الحكم'), value: hadith.grade, inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'عشوائي') {
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
        author: 'الحديث النبوي الشريف',
        title: `حديث عشوائي • ${bookNames[book]}`,
        description: blockquote(hadith.arab),
        fields: [
          { name: bold('المصدر'), value: hadith.book, inline: true },
          { name: bold('الراوي'), value: hadith.narrator, inline: true },
          { name: bold('الحكم'), value: hadith.grade, inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'بحث') {
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
      return;
    }

    if (subcommand === 'أحاديث') {
      const topic = interaction.options.getString('الموضوع', true);
      const topicLabels: Record<string, string> = {
        الصيام: 'الصيام',
        الصلاة: 'الصلاة',
        الأخلاق: 'الأخلاق',
        الزكاة: 'الزكاة',
        الحج: 'الحج',
        الذكر: 'الذكر',
      };
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
      return;
    }

    if (subcommand === 'الأربعون-النووية') {
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
        const local = nawawiHadiths.find(h => h.number === number);
        if (local) {
          const embed = buildEmbed('hadith', {
            title: `الأربعون النووية - الحديث ${number}`,
            description: local.text,
            fields: [
              { name: 'المصدر', value: 'الأربعون النووية', inline: true },
              { name: 'الراوي', value: local.narrator, inline: true },
              { name: 'رقم الحديث', value: `${number}`, inline: true },
            ],
          });
          await interaction.reply({ embeds: [embed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed('تعذر جلب الحديث. حاول مرة أخرى.')] });
        }
      }
      return;
    }
  },
  category: 'hadith',
} as Command;
