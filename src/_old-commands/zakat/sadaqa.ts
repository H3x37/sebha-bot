import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';

interface SadaqaEntry {
  title: string;
  text: string;
  source: string;
}

const entries: SadaqaEntry[] = [
  {
    title: 'الصدقة تطفئ الخطيئة',
    text: 'قال رسول الله ﷺ: "والصدقة تطفئ الخطيئة كما يطفئ الماء النار"',
    source: 'رواه الترمذي وابن ماجه',
  },
  {
    title: 'الصدقة تمنع البلاء',
    text: 'قال رسول الله ﷺ: "صنائع المعروف تقي مصارع السوء، والصدقة تطفئ غضب الرب"',
    source: 'رواه الترمذي',
  },
  {
    title: 'فضل الصدقة',
    text: 'قال الله تعالى: "مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنْبُلَةٍ مِّائَةُ حَبَّةٍ وَاللَّهُ يُضَاعِفُ لِمَن يَشَاءُ وَاللَّهُ وَاسِعٌ عَلِيمٌ"',
    source: 'سورة البقرة، الآية 261',
  },
  {
    title: 'الصدقة الجارية',
    text: 'قال رسول الله ﷺ: "إذا مات ابن آدم انقطع عمله إلا من ثلاث: صدقة جارية، أو علم ينتفع به، أو ولد صالح يدعو له"',
    source: 'رواه مسلم',
  },
  {
    title: 'إطعام الطعام',
    text: 'قال رسول الله ﷺ: "أيما مؤمن أطعم مؤمناً على جوع أطعمه الله من ثمار الجنة، وأيما مؤمن سقى مؤمناً على ظمأ سقاه الله من الرحيق المختوم"',
    source: 'رواه أبو داود والترمذي',
  },
  {
    title: 'الصدقة والبركة',
    text: 'قال رسول الله ﷺ: "ما نقصت صدقة من مال، وما زاد الله عبداً بعفو إلا عزاً، وما تواضع أحد لله إلا رفعه الله"',
    source: 'رواه مسلم',
  },
  {
    title: 'كفارة الذنوب',
    text: 'قال رسول الله ﷺ: "الصدقة تطفئ غضب الرب وتدفع ميتة السوء"',
    source: 'رواه الترمذي',
  },
  {
    title: 'الصدقة على الأقربين',
    text: 'قالت عائشة رضي الله عنها: قال رسول الله ﷺ: "إن الصدقة على المسكين صدقة، وعلى ذي الرحم ثنتان: صدقة وصلة"',
    source: 'رواه الترمذي والنسائي',
  },
  {
    title: 'الإنفاق في سبيل الله',
    text: 'قال الله تعالى: "الَّذِينَ يُنفِقُونَ أَمْوَالَهُم بِاللَّيْلِ وَالنَّهَارِ سِرًّا وَعَلَانِيَةً فَلَهُمْ أَجْرُهُمْ عِندَ رَبِّهِمْ وَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ"',
    source: 'سورة البقرة، الآية 274',
  },
  {
    title: 'الصدقة السرية',
    text: 'قال رسول الله ﷺ: "سبعة يظلهم الله في ظله يوم لا ظل إلا ظله..." وذكر منهم: "ورجل تصدق بصدقة فأخفاها حتى لا تعلم شماله ما تنفق يمينه"',
    source: 'متفق عليه',
  },
];

function getEntryByDate(): SadaqaEntry {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const diff = Date.now() - start;
  const dayOfYear = Math.floor(diff / 86400000);
  return entries[dayOfYear % entries.length];
}

export default {
  data: new SlashCommandBuilder()
    .setName('فضل-الصدقة')
    .setDescription('آية أو حديث عن فضل الصدقة'),

  async execute(interaction: ChatInputCommandInteraction) {
    const entry = getEntryByDate();

    const embed = buildEmbed('zakat', {
      title: entry.title,
      description: entry.text,
      fields: [
        { name: 'المصدر', value: entry.source },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'zakat',
} as Command;
