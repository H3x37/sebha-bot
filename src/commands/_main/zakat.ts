import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { bold, blockquote } from '../../utils/format';

const currencyNames: Record<string, string> = {
  USD: 'دولار أمريكي',
  EUR: 'يورو',
  SAR: 'ريال سعودي',
  AED: 'درهم إماراتي',
  EGP: 'جنيه مصري',
};

const nisabValues: Record<string, { gold: number; silver: number }> = {
  USD: { gold: 6375, silver: 535 },
  EUR: { gold: 5900, silver: 495 },
  SAR: { gold: 23900, silver: 2005 },
  AED: { gold: 23400, silver: 1965 },
  EGP: { gold: 308000, silver: 25850 },
};

interface SadaqaEntry {
  title: string;
  text: string;
  source: string;
}

const entries: SadaqaEntry[] = [
  { title: 'الصدقة تطفئ الخطيئة', text: 'قال رسول الله ﷺ: "والصدقة تطفئ الخطيئة كما يطفئ الماء النار"', source: 'رواه الترمذي وابن ماجه' },
  { title: 'الصدقة تمنع البلاء', text: 'قال رسول الله ﷺ: "صنائع المعروف تقي مصارع السوء، والصدقة تطفئ غضب الرب"', source: 'رواه الترمذي' },
  { title: 'فضل الصدقة', text: 'قال الله تعالى: "مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنْبُلَةٍ مِّائَةُ حَبَّةٍ وَاللَّهُ يُضَاعِفُ لِمَن يَشَاءُ وَاللَّهُ وَاسِعٌ عَلِيمٌ"', source: 'سورة البقرة، الآية 261' },
  { title: 'الصدقة الجارية', text: 'قال رسول الله ﷺ: "إذا مات ابن آدم انقطع عمله إلا من ثلاث: صدقة جارية، أو علم ينتفع به، أو ولد صالح يدعو له"', source: 'رواه مسلم' },
  { title: 'إطعام الطعام', text: 'قال رسول الله ﷺ: "أيما مؤمن أطعم مؤمناً على جوع أطعمه الله من ثمار الجنة، وأيما مؤمن سقى مؤمناً على ظمأ سقاه الله من الرحيق المختوم"', source: 'رواه أبو داود والترمذي' },
  { title: 'الصدقة والبركة', text: 'قال رسول الله ﷺ: "ما نقصت صدقة من مال، وما زاد الله عبداً بعفو إلا عزاً، وما تواضع أحد لله إلا رفعه الله"', source: 'رواه مسلم' },
  { title: 'كفارة الذنوب', text: 'قال رسول الله ﷺ: "الصدقة تطفئ غضب الرب وتدفع ميتة السوء"', source: 'رواه الترمذي' },
  { title: 'الصدقة على الأقربين', text: 'قالت عائشة رضي الله عنها: قال رسول الله ﷺ: "إن الصدقة على المسكين صدقة، وعلى ذي الرحم ثنتان: صدقة وصلة"', source: 'رواه الترمذي والنسائي' },
  { title: 'الإنفاق في سبيل الله', text: 'قال الله تعالى: "الَّذِينَ يُنفِقُونَ أَمْوَالَهُم بِاللَّيْلِ وَالنَّهَارِ سِرًّا وَعَلَانِيَةً فَلَهُمْ أَجْرُهُمْ عِندَ رَبِّهِمْ وَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ"', source: 'سورة البقرة، الآية 274' },
  { title: 'الصدقة السرية', text: 'قال رسول الله ﷺ: "سبعة يظلهم الله في ظله يوم لا ظل إلا ظله..." وذكر منهم: "ورجل تصدق بصدقة فأخفاها حتى لا تعلم شماله ما تنفق يمينه"', source: 'متفق عليه' },
];

function getEntryByDate(): SadaqaEntry {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const diff = Date.now() - start;
  const dayOfYear = Math.floor(diff / 86400000);
  return entries[dayOfYear % entries.length];
}

export default {
  data: new SlashCommandBuilder()
    .setName('زكاة')
    .setDescription('أمر الزكاة الموحد')
    .addSubcommand(sub =>
      sub.setName('مال')
        .setDescription('حساب زكاة المال')
        .addNumberOption(option =>
          option.setName('المبلغ')
            .setDescription('المبلغ الذي تريد حساب زكاته')
            .setRequired(true)
            .setMinValue(0))
        .addStringOption(option =>
          option.setName('العملة')
            .setDescription('عملة المبلغ')
            .setRequired(true)
            .addChoices(
              { name: 'دولار أمريكي (USD)', value: 'USD' },
              { name: 'يورو (EUR)', value: 'EUR' },
              { name: 'ريال سعودي (SAR)', value: 'SAR' },
              { name: 'درهم إماراتي (AED)', value: 'AED' },
              { name: 'جنيه مصري (EGP)', value: 'EGP' },
              { name: 'أخرى', value: 'other' },
            ))
        .addStringOption(option =>
          option.setName('عملة-أخرى')
            .setDescription('اسم العملة إذا اخترت "أخرى"')
            .setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('فطر')
        .setDescription('معلومات عن زكاة الفطر'))
    .addSubcommand(sub =>
      sub.setName('نصاب')
        .setDescription('نصاب الذهب والفضة لهذا اليوم'))
    .addSubcommand(sub =>
      sub.setName('فضل-الصدقة')
        .setDescription('آية أو حديث عن فضل الصدقة')),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'مال') {
      const amount = interaction.options.getNumber('المبلغ', true);
      const currency = interaction.options.getString('العملة', true);
      const otherCurrency = interaction.options.getString('عملة-أخرى');

      if (currency === 'other' && !otherCurrency) {
        await interaction.reply({ embeds: [errorEmbed('يرجى تحديد اسم العملة الأخرى.')] });
        return;
      }

      const zakat = amount * 0.025;
      const label = currency === 'other' ? otherCurrency! : currencyNames[currency];

      const fields: { name: string; value: string; inline?: boolean }[] = [
        { name: 'المبلغ', value: `${amount.toFixed(2)} ${label}`, inline: true },
        { name: 'مقدار الزكاة (2.5%)', value: `${zakat.toFixed(2)} ${label}`, inline: true },
      ];

      if (currency !== 'other') {
        const nisab = nisabValues[currency];
        const reachesNisab = amount >= nisab.silver;
        fields.push(
          { name: 'نصاب الذهب (85 جم)', value: `${nisab.gold.toFixed(2)} ${label}`, inline: true },
          { name: 'نصاب الفضة (595 جم)', value: `${nisab.silver.toFixed(2)} ${label}`, inline: true },
          { name: 'حالة النصاب', value: reachesNisab ? '✅ يبلغ النصاب' : '❌ لا يبلغ النصاب', inline: false },
        );
      }

      const embed = buildEmbed('zakat', {
        author: 'حساب الزكاة',
        title: '💎 زكاة المال',
        description: blockquote(`الزكاة الواجبة: ${bold(`${zakat.toFixed(2)} ${label}`)}`),
        fields: fields.map(f => ({ ...f, name: bold(f.name) })),
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'فطر') {
      const currentYear = new Date().getFullYear();
      const estimatedValue = `${(currentYear * 0.5 + 2).toFixed(2)} USD`;

      const embed = buildEmbed('zakat', {
        author: 'زكاة الفطر',
        title: '💎 زكاة الفطر',
        fields: [
          { name: bold('تعريفها'), value: 'زكاة الفطر هي صدقة يجب إخراجها قبل صلاة عيد الفطر، طهرة للصائم من اللغو والرفث، وطعمة للمساكين.' },
          { name: bold('مقدارها'), value: 'صاع من طعام (حوالي 2.5 - 3 كجم) من قوت البلد: أرز، تمر، شعير، زبيب، أو أقط. وتُخرج نقداً بقيمته عند كثير من العلماء.' },
          { name: bold('وقت إخراجها'), value: 'وقت وجوبها: غروب شمس آخر يوم من رمضان. وقت جوازها: قبل العيد بيوم أو يومين. وقت استحبابها: صباح العيد قبل الصلاة. وقت كراهتها: بعد صلاة العيد.' },
          { name: bold('المستحقون'), value: 'الفقير والمسكين، وهي تقدم على سائر الصدقات لأنها فرض. قال النبي ﷺ: "أغنوهم عن الطلب في هذا اليوم".' },
          { name: bold(`القيمة (${currentYear})`), value: `${estimatedValue} للفرد.` },
          { name: bold('الدليل'), value: 'عن ابن عمر رضي الله عنهما: "فرض رسول الله ﷺ زكاة الفطر صاعاً من تمر..." (متفق عليه).' },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'نصاب') {
      const goldPerGram = 75;
      const silverPerGram = 0.9;
      const goldNisab = 85 * goldPerGram;
      const silverNisab = 595 * silverPerGram;

      const currencies = [
        { code: 'USD', name: 'دولار أمريكي', rate: 1 },
        { code: 'EUR', name: 'يورو', rate: 1.08 },
        { code: 'SAR', name: 'ريال سعودي', rate: 0.267 },
        { code: 'AED', name: 'درهم إماراتي', rate: 0.272 },
        { code: 'EGP', name: 'جنيه مصري', rate: 0.0207 },
      ];

      const today = new Date().toLocaleDateString('ar-SA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      const embed = buildEmbed('zakat', {
        author: 'نصاب الزكاة',
        title: '💎 نصاب الزكاة',
        fields: [
          { name: bold('التاريخ'), value: today, inline: false },
          { name: bold('نصاب الذهب (85 جم)'), value: currencies.map(c => `${c.name}: ${(goldNisab * c.rate).toFixed(2)} ${c.code}`).join('\n'), inline: true },
          { name: bold('نصاب الفضة (595 جم)'), value: currencies.map(c => `${c.name}: ${(silverNisab * c.rate).toFixed(2)} ${c.code}`).join('\n'), inline: true },
        ],
        footer: 'الأسعار تقريبية',
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'فضل-الصدقة') {
      const entry = getEntryByDate();

      const embed = buildEmbed('zakat', {
        author: 'فضل الصدقة',
        title: `💎 ${entry.title}`,
        description: blockquote(entry.text),
        fields: [{ name: bold('المصدر'), value: entry.source }],
      });

      await interaction.reply({ embeds: [embed] });
    }
  },
  category: 'zakat',
} as Command;
