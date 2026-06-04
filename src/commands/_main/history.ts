import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { bold, blockquote } from '../../utils/format';
import { historicalEvents } from '../../data/events';
import axios from 'axios';

function normalizeArabic(text: string): string {
  return text.replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
}

interface Sahabi {
  name: string;
  title: string;
  birth: string;
  biography: string;
  virtues: string;
  death: string;
}

const sahabaDB: Sahabi[] = [
  { name: 'أبو بكر الصديق', title: 'الصديق • خليفة رسول الله ﷺ', birth: 'ولد في مكة بعد عام الفيل بسنتين وستة أشهر', biography: 'عبد الله بن أبي قحافة التيمي القرشي. أول من آمن من الرجال، وأول الخلفاء الراشدين. رفيق النبي ﷺ في الهجرة وصاحبه في الغار. أنفق ماله كله في سبيل الله. ثبت الأمة بعد وفاة النبي ﷺ وقاتل المرتدين.', virtues: 'أفضل هذه الأمة بعد نبيها، قال فيه النبي ﷺ: "لو كنت متخذاً خليلاً لاتخذت أبا بكر خليلاً". وهو الذي جمع القرآن في مصحف واحد.', death: 'توفي سنة 13 هـ وعمره 63 سنة، ودفن إلى جانب النبي ﷺ في حجرة عائشة.' },
  { name: 'عمر بن الخطاب', title: 'الفاروق • أمير المؤمنين', birth: 'ولد في مكة سنة 40 عام الفيل', biography: 'عمر بن الخطاب بن نفيل العدوي القرشي. أسلم في السنة السادسة من النبوة، وكان إسلامه عزاً للمسلمين. ثاني الخلفاء الراشدين. فتحت في خلافته الشام والعراق ومصر وبلاد فارس.', virtues: 'قال النبي ﷺ: "إن الله جعل الحق على لسان عمر وقلبه". وكان الشيطان يفرق من طريق عمر.', death: 'استشهد في 26 ذو الحجة سنة 23 هـ طعنه أبو لؤلؤة المجوسي.' },
  { name: 'عثمان بن عفان', title: 'ذو النورين • أمير المؤمنين', birth: 'ولد في مكة سنة 6 عام الفيل', biography: 'عثمان بن عفان بن أبي العاص الأموي القرشي. ثالث الخلفاء الراشدين. جمع القرآن في مصحف واحد وأرسله إلى الأمصار. زوج ابنتي النبي ﷺ.', virtues: 'قال النبي ﷺ: "ألا أستحي من رجل تستحي منه الملائكة".', death: 'استشهد في 18 ذو الحجة سنة 35 هـ.' },
  { name: 'علي بن أبي طالب', title: 'أسد الله • كرم الله وجهه', birth: 'ولد في مكة قبل البعثة بعشر سنين', biography: 'علي بن أبي طالب بن عبد المطلب الهاشمي. ابن عم النبي ﷺ وزوج ابنته فاطمة. أول من آمن من الصبيان. رابع الخلفاء الراشدين.', virtues: 'قال النبي ﷺ: "أنت مني بمنزلة هارون من موسى إلا أنه لا نبي بعدي".', death: 'استشهد في 21 رمضان سنة 40 هـ.' },
  { name: 'خالد بن الوليد', title: 'سيف الله المسلول', birth: 'ولد في مكة سنة 20 عام الفيل', biography: 'خالد بن الوليد بن المغيرة المخزومي القرشي. كان قائداً عظيماً لم يُهزم في معركة قط. أسلم سنة 7 هـ. قاد جيوش المسلمين في فتح الشام والعراق.', virtues: 'قال النبي ﷺ: "خالد سيف من سيوف الله".', death: 'توفي سنة 21 هـ في حمص.' },
  { name: 'بلال بن رباح', title: 'مؤذن رسول الله ﷺ', birth: 'ولد في مكة، من أصل حبشي', biography: 'بلال بن رباح الحبشي. مولى أبي بكر الصديق. أول مؤذن في الإسلام. عُذب في مكة وكان يقول: "أحد أحد".', virtues: 'سمع النبي ﷺ نعلي بلال في الجنة.', death: 'توفي سنة 20 هـ في دمشق.' },
  { name: 'أبو هريرة', title: 'حافظ الأمة', birth: 'ولد في اليمن، أسلم سنة 7 هـ', biography: 'عبد الرحمن بن صخر الدوسي. أكثر الصحابة حفظاً للحديث، روى 5374 حديثاً. لازم النبي ﷺ وخدمه.', virtues: 'دعا له النبي ﷺ: "اللهم حببه إلى المؤمنين".', death: 'توفي سنة 59 هـ بالمدينة.' },
  { name: 'عبد الله بن عباس', title: 'ترجمان القرآن • حبر الأمة', birth: 'ولد في مكة قبل الهجرة بثلاث سنين', biography: 'عبد الله بن عباس بن عبد المطلب الهاشمي. ابن عم النبي ﷺ. كان عالماً فقيهاً مفسراً.', virtues: 'دعا له النبي ﷺ: "اللهم فقه في الدين وعلمه التأويل".', death: 'توفي سنة 68 هـ بالطائف.' },
  { name: 'حمزة بن عبد المطلب', title: 'أسد الله وأسد رسوله • سيد الشهداء', birth: 'ولد في مكة قبل النبي ﷺ بسنتين', biography: 'حمزة بن عبد المطلب الهاشمي. عم النبي ﷺ وأخوه من الرضاعة. أسلم في السنة الثانية من النبوة.', virtues: 'قال النبي ﷺ: "سيد الشهداء حمزة بن عبد المطلب".', death: 'استشهد في غزوة أحد سنة 3 هـ.' },
  { name: 'جعفر بن أبي طالب', title: 'جعفر الطيار • ذو الجناحين', birth: 'ولد في مكة قبل البعثة بعشر سنين', biography: 'جعفر بن أبي طالب الهاشمي. ابن عم النبي ﷺ وأخو علي. هاجر إلى الحبشة وقاد المسلمين هناك.', virtues: 'أبدله الله جناحين في الجنة يطير بهما.', death: 'استشهد في غزوة مؤتة سنة 8 هـ.' },
  { name: 'سلمان الفارسي', title: 'سلمان الخير • ابن الإسلام', birth: 'ولد في أصبهان (فارس)', biography: 'سلمان بن الإسلام. فارسي الأصل، رحل في طلب الحق حتى لقيه في المدينة. أشار بحفر الخندق.', virtues: 'قال النبي ﷺ: "سلمان منا آل البيت".', death: 'توفي سنة 36 هـ بالمدائن.' },
  { name: 'أبو ذر الغفاري', title: 'أبو ذر • أصدق لهجة', birth: 'ولد في قبيلة غفار', biography: 'جندب بن جنادة الغفاري. أسلم قديماً، ورابع من أسلم. كان معروفاً بصدقه وشجاعته.', virtues: 'قال النبي ﷺ: "ما أظلت الخضراء ولا أفلت الغبراء من أصدق لهجة من أبي ذر".', death: 'توفي سنة 32 هـ في الربذة.' },
  { name: 'أنس بن مالك', title: 'خادم رسول الله ﷺ', birth: 'ولد في المدينة قبل الهجرة بعشر سنين', biography: 'أنس بن مالك الخزرجي. خدم النبي ﷺ عشر سنين. كان من أكثر الصحابة رواية للحديث.', virtues: 'قال النبي ﷺ: "اللهم أكثر ماله وولده وبارك له فيه".', death: 'توفي سنة 93 هـ بالبصرة.' },
  { name: 'زيد بن ثابت', title: 'كاتب الوحي', birth: 'ولد في المدينة قبل الهجرة', biography: 'زيد بن ثابت بن الضحاك الخزرجي. تعلم السريانية واليهودية ليترجم للنبي ﷺ. كان كاتب الوحي. جمع القرآن.', virtues: 'قال النبي ﷺ: "أفرض أمتي زيد بن ثابت".', death: 'توفي سنة 45 هـ بالمدينة.' },
  { name: 'أبي بن كعب', title: 'سيد القراء', birth: 'ولد في المدينة من بني الخزرج', biography: 'أبي بن كعب بن قيس الخزرجي. من نقباء الأنصار. شهد بدراً. كان أقرأ الصحابة للقرآن.', virtues: 'قال النبي ﷺ: "أقرؤهم أبي بن كعب".', death: 'توفي سنة 30 هـ بالمدينة.' },
];

interface SeerahTopic {
  key: string;
  title: string;
  summary: string;
  details: string;
  lessons: string;
}

const seerahData: Record<string, SeerahTopic> = {
  الميلاد: {
    key: 'الميلاد', title: 'ميلاد النبي صلى الله عليه وسلم',
    summary: 'ولد سيدنا محمد صلى الله عليه وسلم في مكة المكرمة في عام الفيل (نحو 571م)، يوم الاثنين 12 ربيع الأول.',
    details: 'ولد صلى الله عليه وسلم يتيم الأب، فقد توفي والده عبد الله بن عبد المطلب وهو حمل في بطن أمه آمنة بنت وهب. أرضعته ثويبة مولاة أبي لهب أولاً، ثم حليمة السعدية. شق صدره في بني سعد، وشب صلى الله عليه وسلم معروفاً بالصدق والأمانة حتى لقبه قومه "الأمين". توفيت أمه وهو ابن 6 سنوات، ثم كفله جده عبد المطلب، ثم عمه أبو طالب.',
    lessons: 'اختيار الله له صلى الله عليه وسلم منذ ولادته، ورعايته وتأديبه حتى كان أحسن قومه خلقاً.',
  },
  النبوة: {
    key: 'النبوة', title: 'بداية النبوة والوحي',
    summary: 'نزل الوحي على النبي صلى الله عليه وسلم وهو في غار حراء في شهر رمضان، وعمره 40 سنة.',
    details: 'كان أول ما نزل من القرآن "اقرأ باسم ربك الذي خلق". بدأ الوحي برؤيا صادقة، ثم حبب إليه الخلاء، فكان يخلو في غار حراء يتحنث الليالي ذوات العدد. جاءه جبريل عليه السلام وقال له "اقرأ" فقال "ما أنا بقارئ" حتى قال له "اقرأ باسم ربك الذي خلق". رجع صلى الله عليه وسلم إلى خديجة رضي الله عنها ترجف بوادره، فذهبوا إلى ورقة بن نوفل الذي أخبره بأنه نبي هذه الأمة.',
    lessons: 'الصبر على تبليغ الرسالة، وصدق اليقين بأن الله لا يضيع من توكل عليه.',
  },
  الهجرة: {
    key: 'الهجرة', title: 'الهجرة النبوية إلى المدينة',
    summary: 'هاجر النبي صلى الله عليه وسلم من مكة إلى المدينة المنورة في ربيع الأول سنة 1 هـ (622م).',
    details: 'هاجر النبي صلى الله عليه وسلم بعد أن مكث في مكة 13 عاماً يدعو إلى الله. خرج معه أبو بكر الصديق رضي الله عنه، واختبآ في غار ثور ثلاثة أيام. جعل عبد الله بن أريقط دليلاً لهما. وصل صلى الله عليه وسلم إلى قباء، وأسس أول مسجد في الإسلام، ثم دخل المدينة واستقبله الأنصار بحفاوة بالغة.',
    lessons: 'التوكل على الله مع الأخذ بالأسباب، والتضحية في سبيل الدين، وأخوة المهاجرين والأنصار.',
  },
  الغزوات: {
    key: 'الغزوات', title: 'غزوات النبي صلى الله عليه وسلم',
    summary: 'غزا النبي صلى الله عليه وسلم 27 غزوة، قاتل في 9 منها. بدأت بغزوة بدر الكبرى وانتهت بغزوة تبوك.',
    details: 'أهم الغزوات: غزوة بدر (2 هـ) انتصر فيها المسلمون على قريش رغم قلة عددهم. غزوة أحد (3 هـ) هزم فيها المسلمون بسبب مخالفة الرماة. غزوة الأحزاب (5 هـ) صرف الله فيها الأحزاب. غزوة خيبر (7 هـ) فتح حصون اليهود. غزوة مؤتة (8 هـ) ضد الروم. فتح مكة (8 هـ) أعظم الفتوح. غزوة حنين (8 هـ). غزوة تبوك (9 هـ) آخر غزواته صلى الله عليه وسلم.',
    lessons: 'الصبر في الشدة، والثبات عند اللقاء، وطاعة القائد، وأن النصر من عند الله وحده.',
  },
  'فتح-مكة': {
    key: 'فتح-مكة', title: 'فتح مكة المكرمة',
    summary: 'دخل النبي صلى الله عليه وسلم مكة فاتحاً في 20 رمضان سنة 8 هـ، دون قتال يذكر، وحطم الأصنام حول الكعبة.',
    details: 'خرج النبي صلى الله عليه وسلم في عشرة آلاف مقاتل متوجهاً إلى مكة. دخلها صلى الله عليه وسلم من أعلاها وهو على ناقته القصواء. طاف بالبيت وحطم الأصنام وهو يقرأ "وجاء الحق وزهق الباطل". ثم خطب في الناس وقال لقريش: "ما تظنون أني فاعل بكم؟" قالوا: خيراً، أخ كريم وابن أخ كريم. فقال: "اذهبوا فأنتم الطلقاء".',
    lessons: 'العفو عن المسيء عند المقدرة، والتواضع لله عند النصر، والرحمة بالناس.',
  },
  'حجة-الوداع': {
    key: 'حجة-الوداع', title: 'حجة الوداع',
    summary: 'حج النبي صلى الله عليه وسلم حجة واحدة بعد الهجرة هي حجة الوداع في السنة 10 هـ.',
    details: 'خطب النبي صلى الله عليه وسلم خطبة الوداع العظيمة يوم عرفة: "أيها الناس، إن دماءكم وأموالكم وأعراضكم عليكم حرام". قال "تركت فيكم ما إن تمسكتم به لن تضلوا بعدي أبداً: كتاب الله وسنتي". وأنزل الله عليه "اليوم أكملت لكم دينكم وأتممت عليكم نعمتي ورضيت لكم الإسلام ديناً".',
    lessons: 'كمال الدين وتمام النعمة، والوصية بالكتاب والسنة، وحرمة الدماء والأموال والأعراض.',
  },
  الوفاة: {
    key: 'الوفاة', title: 'وفاة النبي صلى الله عليه وسلم',
    summary: 'توفي النبي صلى الله عليه وسلم في يوم الاثنين 12 ربيع الأول سنة 11 هـ (632م) وعمره 63 عاماً.',
    details: 'بدأ مرض النبي صلى الله عليه وسلم في أواخر شهر صفر. استأذن أزواجه أن يمرض في بيت عائشة. صلى أبو بكر بالصحابة بأمره. قال عند وفاته: "اللهم الرفيق الأعلى" ثم فاضت روحه. بكى الصحابة، ووقف عمر يقول: "من قال إن محمداً مات ضربته بسيفي". فخطب أبو بكر: "من كان يعبد محمداً فإن محمداً قد مات، ومن كان يعبد الله فإن الله حي لا يموت".',
    lessons: 'اليقين بأن الموت حق، وأن الدين كمل، وأن علينا اتباع سنته صلى الله عليه وسلم.',
  },
};

const islamicOccasions: [number, number, string][] = [
  [1, 1, '📅 رأس السنة الهجرية - بداية العام الهجري الجديد'],
  [1, 10, '🌙 يوم عاشوراء - صيامه يكفر سنة ماضية'],
  [3, 12, '🕌 المولد النبوي الشريف - مولد خير البشر محمد صلى الله عليه وسلم'],
  [7, 27, '🌟 رحلة الإسراء والمعراج - فرضت فيها الصلاة'],
  [8, 15, '🌙 ليلة النصف من شعبان - ليلة البراءة'],
  [9, 1, '☪️ أول أيام شهر رمضان المبارك'],
  [9, 17, '⚔️ غزوة بدر الكبرى - الفرقان - 2 هـ'],
  [9, 20, '🕊️ فتح مكة المكرمة - 8 هـ'],
  [9, 27, '🌙 ليلة القدر - خير من ألف شهر'],
  [10, 1, '🎉 عيد الفطر المبارك'],
  [12, 9, '🌅 يوم عرفة - وقفة الحج الأكبر'],
  [12, 10, '🕋 عيد الأضحى المبارك'],
];

function getIslamicOccasion(hijriMonth: number, hijriDay: number): string | null {
  for (const [month, day, description] of islamicOccasions) {
    if (month === hijriMonth && day === hijriDay) return description;
  }
  return null;
}

export default {
  data: new SlashCommandBuilder()
    .setName('تاريخ')
    .setDescription('أمر التاريخ الإسلامي الموحد')
    .addSubcommand(sub =>
      sub.setName('اليوم')
        .setDescription('حدث تاريخي إسلامي في مثل هذا اليوم'))
    .addSubcommand(sub =>
      sub.setName('هجري')
        .setDescription('اليوم في التقويم الهجري والميلادي مع المناسبات'))
    .addSubcommand(sub =>
      sub.setName('تحويل')
        .setDescription('تحويل التاريخ بين الهجري والميلادي')
        .addIntegerOption(option =>
          option.setName('اليوم')
            .setDescription('اليوم (1-31)')
            .setRequired(true)
            .setMinValue(1).setMaxValue(31))
        .addIntegerOption(option =>
          option.setName('الشهر')
            .setDescription('الشهر (1-12)')
            .setRequired(true)
            .setMinValue(1).setMaxValue(12))
        .addIntegerOption(option =>
          option.setName('السنة')
            .setDescription('السنة')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('إلى')
            .setDescription('تحويل إلى')
            .setRequired(true)
            .addChoices(
              { name: 'هجري', value: 'هجري' },
              { name: 'ميلادي', value: 'ميلادي' },
            )))
    .addSubcommand(sub =>
      sub.setName('صحابي')
        .setDescription('نبذة عن أحد صحابة رسول الله صلى الله عليه وسلم')
        .addStringOption(option =>
          option.setName('الاسم')
            .setDescription('أدخل اسم الصحابي (كامل أو جزء منه)')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('سيرة')
        .setDescription('نبذة عن أحداث السيرة النبوية العطرة')
        .addStringOption(option =>
          option.setName('الموضوع')
            .setDescription('اختر موضوعاً من السيرة النبوية')
            .setRequired(true)
            .addChoices(
              { name: 'الميلاد', value: 'الميلاد' },
              { name: 'النبوة', value: 'النبوة' },
              { name: 'الهجرة', value: 'الهجرة' },
              { name: 'الغزوات', value: 'الغزوات' },
              { name: 'فتح مكة', value: 'فتح-مكة' },
              { name: 'حجة الوداع', value: 'حجة-الوداع' },
              { name: 'الوفاة', value: 'الوفاة' },
            ))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'اليوم') {
      await interaction.deferReply();

      try {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const gregDate = `${day}-${month}-${year}`;

        const { data: response } = await axios.get<{ code: number; data: { hijri: { month: { number: number }; day: string } } }>(
          `https://api.aladhan.com/v1/gToH?date=${gregDate}`
        );

        if (response.code !== 200) throw new Error();

        const hijriMonth = response.data.hijri.month.number;
        const hijriDay = parseInt(response.data.hijri.day, 10);

        const todayEvents = historicalEvents.filter(e => e.month === hijriMonth && e.day === hijriDay);
        const event = todayEvents.length > 0
          ? todayEvents[Math.floor(Math.random() * todayEvents.length)]
          : historicalEvents[Math.floor(Math.random() * historicalEvents.length)];

        const embed = buildEmbed('history', {
          author: 'التاريخ الإسلامي',
          title: `🗡️ ${event.title}`,
          description: blockquote(event.description),
          fields: [
            { name: bold('التاريخ'), value: `${event.dateHijri} ${event.yearHijri}`, inline: true },
            { name: bold('الدلالة'), value: event.significance, inline: false },
          ],
        });

        await interaction.editReply({ embeds: [embed] });
      } catch {
        const random = historicalEvents[Math.floor(Math.random() * historicalEvents.length)];
        const embed = buildEmbed('history', {
          author: 'التاريخ الإسلامي',
          title: `🗡️ ${random.title}`,
          description: blockquote(random.description),
          fields: [
            { name: bold('التاريخ'), value: `${random.dateHijri} ${random.yearHijri}`, inline: true },
            { name: bold('الدلالة'), value: random.significance, inline: false },
          ],
        });
        await interaction.editReply({ embeds: [embed] });
      }
    } else if (sub === 'هجري') {
      await interaction.deferReply();

      try {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const gregDate = `${day}-${month}-${year}`;

        const { data: response } = await axios.get<{ code: number; data: { hijri: { day: string; month: { number: number; ar: string }; year: string }; gregorian: { date: string } } }>(
          `https://api.aladhan.com/v1/gToH?date=${gregDate}`
        );

        if (response.code !== 200) throw new Error();

        const { hijri, gregorian } = response.data;
        const hijriMonth = parseInt(hijri.month.number.toString(), 10);
        const hijriDay = parseInt(hijri.day, 10);
        const occasion = getIslamicOccasion(hijriMonth, hijriDay);

        const fields: { name: string; value: string; inline?: boolean }[] = [
          { name: 'التاريخ الهجري', value: `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`, inline: false },
          { name: 'التاريخ الميلادي', value: gregorian.date.split('-').reverse().join('-'), inline: false },
        ];

        if (occasion) {
          fields.push({ name: 'مناسبة اليوم', value: occasion, inline: false });
        }

        const embed = buildEmbed('history', { author: 'التقويم الهجري', title: '🗡️ التاريخ الهجري', fields: fields.map(f => ({ ...f, name: bold(f.name) })) });
        await interaction.editReply({ embeds: [embed] });
      } catch {
        await interaction.editReply({ embeds: [errorEmbed('تعذر جلب التاريخ الهجري. حاول مرة أخرى لاحقاً.')] });
      }
    } else if (sub === 'تحويل') {
      await interaction.deferReply();

      const day = interaction.options.getInteger('اليوم', true);
      const month = interaction.options.getInteger('الشهر', true);
      const year = interaction.options.getInteger('السنة', true);
      const toType = interaction.options.getString('إلى', true);
      const toHijri = toType === 'هجري';

      if (day < 1 || day > 31 || month < 1 || month > 12) {
        await interaction.editReply({ embeds: [errorEmbed('اليوم يجب أن يكون بين 1 و 31، والشهر بين 1 و 12')] });
        return;
      }

      if (toHijri && (year < 1900 || year > 2100)) {
        await interaction.editReply({ embeds: [errorEmbed('السنة الميلادية يجب أن تكون بين 1900 و 2100')] });
        return;
      }

      if (!toHijri && (year < 1 || year > 1500)) {
        await interaction.editReply({ embeds: [errorEmbed('السنة الهجرية يجب أن تكون بين 1 و 1500')] });
        return;
      }

      try {
        const formattedDay = String(day).padStart(2, '0');
        const formattedMonth = String(month).padStart(2, '0');
        const apiUrl = toHijri
          ? `https://api.aladhan.com/v1/gToH?date=${formattedDay}-${formattedMonth}-${year}`
          : `https://api.aladhan.com/v1/hToG?date=${formattedDay}-${formattedMonth}-${year}`;

        const { data: response } = await axios.get<{ code: number; data: { hijri?: { day: string; month: { ar: string }; year: string }; gregorian?: { day: string; month: { ar: string }; year: string } } }>(apiUrl);

        if (response.code !== 200) throw new Error();

        let resultText: string;
        let title: string;

        if (toHijri) {
          const hijri = response.data.hijri!;
          resultText = `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
          title = 'تحويل التاريخ - ميلادي → هجري';
        } else {
          const gregorian = response.data.gregorian!;
          resultText = `${gregorian.day} ${gregorian.month.ar} ${gregorian.year} م`;
          title = 'تحويل التاريخ - هجري → ميلادي';
        }

        const inputText = toHijri
          ? `${formattedDay}/${formattedMonth}/${year} م`
          : `${formattedDay}/${formattedMonth}/${year} هـ`;

        const embed = buildEmbed('history', {
          author: 'تحويل التاريخ',
          title: '🗡️ تحويل التاريخ',
          description: blockquote(resultText),
          fields: [
            { name: bold('المدخل'), value: inputText, inline: true },
            { name: bold('النتيجة'), value: resultText, inline: true },
          ],
        });

        await interaction.editReply({ embeds: [embed] });
      } catch {
        await interaction.editReply({ embeds: [errorEmbed('تعذر تحويل التاريخ. تأكد من صحة البيانات المدخلة.')] });
      }
    } else if (sub === 'صحابي') {
      const query = interaction.options.getString('الاسم', true).trim();
      const normalizedQuery = normalizeArabic(query);

      const results = sahabaDB.filter(s =>
        s.name.includes(query) ||
        s.title.includes(query) ||
        normalizeArabic(s.name).includes(normalizedQuery) ||
        normalizeArabic(s.title).includes(normalizedQuery)
      );

      if (results.length === 0) {
        await interaction.reply({ embeds: [errorEmbed('لم نجد صحابياً بهذا الاسم. تأكد من الاسم أو ابحث باسم آخر.')] });
        return;
      }

      const sahabi = results[0];

      const embed = buildEmbed('history', {
        author: 'صحابة رسول الله',
        title: `🗡️ ${sahabi.name} رضي الله عنه`,
        description: blockquote(sahabi.title),
        fields: [
          { name: bold('ولادته'), value: sahabi.birth, inline: true },
          { name: bold('وفاته'), value: sahabi.death, inline: true },
          { name: bold('سيرته'), value: sahabi.biography, inline: false },
          { name: bold('فضائله'), value: sahabi.virtues, inline: false },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'سيرة') {
      const topicKey = interaction.options.getString('الموضوع', true);
      const topic = seerahData[topicKey];

      if (!topic) {
        await interaction.reply({ embeds: [errorEmbed('لم يتم العثور على الموضوع المطلوب.')] });
        return;
      }

      const embed = buildEmbed('history', {
        author: 'السيرة النبوية',
        title: `🗡️ ${topic.title}`,
        description: blockquote(topic.summary),
        fields: [
          { name: bold('التفاصيل'), value: topic.details, inline: false },
          { name: bold('الدروس والعبر'), value: topic.lessons, inline: false },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    }
  },
  category: 'history',
} as Command;
