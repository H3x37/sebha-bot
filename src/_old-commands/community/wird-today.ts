import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';

const surahs = [
  { name: 'الفاتحة', verses: 7 },
  { name: 'يس', verses: 83 },
  { name: 'الملك', verses: 30 },
  { name: 'الواقعة', verses: 96 },
  { name: 'الكهف', verses: 110 },
  { name: 'الرحمن', verses: 78 },
  { name: 'الصافات', verses: 182 },
  { name: 'الإنسان', verses: 31 },
  { name: 'النبأ', verses: 40 },
  { name: 'الطارق', verses: 17 },
];

const adhkarBlocks = [
  {
    title: 'أذكار الصباح',
    content: [
      'سبحان الله وبحمده (١٠٠ مرة)',
      'لا إله إلا الله وحده لا شريك له (١٠ مرات)',
      'اللهم صل وسلم على نبينا محمد (١٠ مرات)',
      'أستغفر الله وأتوب إليه (١٠ مرات)',
      'اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور',
    ].join('\n'),
  },
  {
    title: 'أذكار المساء',
    content: [
      'قراءة آية الكرسي',
      'المعوذات (الإخلاص + الفلق + الناس) ٣ مرات',
      'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم (٧ مرات)',
      'اللهم أنت ربي لا إله إلا أنت خلقتني وأنا عبدك',
    ].join('\n'),
  },
  {
    title: 'أذكار النوم',
    content: [
      'آية الكرسي',
      'سبحان الله (٣٣ مرة)',
      'الحمد لله (٣٣ مرة)',
      'الله أكبر (٣٤ مرة)',
      'اللهم باسمك أموت وأحيا',
    ].join('\n'),
  },
  {
    title: 'أذكار الاستيقاظ',
    content: [
      'الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور',
      'لا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير',
    ].join('\n'),
  },
];

const prayers = [
  { name: 'صلاة الفجر', reward: 'كالذي قام الليل كله' },
  { name: 'صلاة الضحى', reward: 'تعدل ٣٦٠ صدقة' },
  { name: 'صلاة الظهر', reward: 'كفارة للذنوب' },
  { name: 'صلاة العصر', reward: 'كأنما صلى في المسجد الحرام' },
  { name: 'صلاة المغرب', reward: 'مثل حجة وعمرة' },
  { name: 'صلاة العشاء', reward: 'كقيام ليلة' },
  { name: 'قيام الليل', reward: 'أفضل الصلاة بعد الفريضة' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('ورد-اليوم')
    .setDescription('اقتراح ورد يومي كامل'),

  async execute(interaction: ChatInputCommandInteraction) {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const surah = surahs[dayOfYear % surahs.length];
    const adhkar = adhkarBlocks[Math.floor(dayOfYear / 7) % adhkarBlocks.length];
    const prayer = prayers[Math.floor(dayOfYear / 3) % prayers.length];

    const embed = buildEmbed('community', {
      title: 'وِرد اليوم',
      description: [
        'بسم الله الرحمن الرحيم',
        '',
        'اللهم اجعل هذا اليوم مباركاً ووفقنا فيه لطاعتك.',
        '',
        '﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ﴾',
      ].join('\n'),
      fields: [
        {
          name: 'القرآن الكريم',
          value: [
            `**سورة ${surah.name}** (${surah.verses} آية)`,
            'اقرأها بتدبر وتفكر في معانيها.',
            '',
            'ثم اقرأ ما تيسر من القرآن بخشوع.',
          ].join('\n'),
        },
        {
          name: 'الأذكار',
          value: `**${adhkar.title}**\n${adhkar.content}`,
        },
        {
          name: 'الصلوات',
          value: [
            `**${prayer.name}**`,
            `${prayer.reward}`,
            '',
            'حافظ على جميع الصلوات الخمس في أوقاتها.',
          ].join('\n'),
        },
        {
          name: 'وصية اليوم',
          value: [
            'أكثر من الاستغفار فإنه مفتاح الفرج.',
            'قال الله تعالى:',
            '﴿فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا﴾',
          ].join('\n'),
        },
      ],
      footer: 'اللهم تقبل منا إنك أنت السميع العليم',
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'community',
} as Command;
