import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

const levels = [
  { name: 'طالب علم', minPoints: 0 },
  { name: 'مثقف', minPoints: 100 },
  { name: 'عالم', minPoints: 300 },
  { name: 'شيخ', minPoints: 600 },
  { name: 'قدوة', minPoints: 1000 },
];

interface Question {
  question: string;
  choices: string[];
  correct: number;
}

const easy: Question[] = [
  { question: 'كم عدد سور القرآن الكريم؟', choices: ['110', '114', '120', '100'], correct: 1 },
  { question: 'ما هي السورة التي تسمى قلب القرآن؟', choices: ['يس', 'الفاتحة', 'الإخلاص', 'البقرة'], correct: 0 },
  { question: 'ما هي أطول سورة في القرآن؟', choices: ['البقرة', 'آل عمران', 'النساء', 'الأعراف'], correct: 0 },
  { question: 'كم عدد أجزاء القرآن؟', choices: ['20', '25', '30', '35'], correct: 2 },
  { question: 'أي سورة تسمى عروس القرآن؟', choices: ['الرحمن', 'يس', 'الفاتحة', 'الملك'], correct: 0 },
  { question: 'في أي ليلة نزل القرآن؟', choices: ['ليلة القدر', 'ليلة الإسراء', 'ليلة النصف من شعبان', 'ليلة عرفة'], correct: 0 },
  { question: 'ما هي أول سورة نزلت في القرآن؟', choices: ['الفاتحة', 'العلق', 'القلم', 'المزمل'], correct: 1 },
  { question: 'ما هي آخر سورة نزلت؟', choices: ['النصر', 'المائدة', 'الإخلاص', 'الناس'], correct: 0 },
  { question: 'كم عدد آيات سورة الفاتحة؟', choices: ['5', '6', '7', '8'], correct: 2 },
  { question: 'ما معنى "الفاتحة"؟', choices: ['الخاتمة', 'الافتتاح', 'الوسطى', 'الكبرى'], correct: 1 },
  { question: 'كم عدد سور المكية في القرآن؟', choices: ['82', '86', '90', '78'], correct: 1 },
  { question: 'ما اسم السورة التي ذكرت فيها البسملة مرتين؟', choices: ['النمل', 'الإسراء', 'هود', 'مريم'], correct: 0 },
  { question: 'ما هي أقصر سورة في القرآن؟', choices: ['الإخلاص', 'الكوثر', 'النصر', 'العصر'], correct: 1 },
  { question: 'كم عدد آيات سورة الإخلاص؟', choices: ['2', '3', '4', '5'], correct: 2 },
  { question: 'ما معنى "يس"؟', choices: ['يا إنسان', 'يا نبي', 'من المتشابه', 'الله أعلم'], correct: 2 },
  { question: 'أي سورة تسمى سورة النساء الصغرى؟', choices: ['الطلاق', 'الممتحنة', 'التحريم', 'المجادلة'], correct: 0 },
  { question: 'ما السورة التي إذا قرأتها فكأنما قرأت ثلث القرآن؟', choices: ['الإخلاص', 'يس', 'الملك', 'الواقعة'], correct: 0 },
  { question: 'كم عدد آيات سورة البقرة؟', choices: ['256', '260', '276', '286'], correct: 3 },
  { question: 'ما أول آية نزلت من القرآن؟', choices: ['الحمد لله رب العالمين', 'اقرأ باسم ربك', 'الم', 'تبارك الذي'], correct: 1 },
  { question: 'ما السورة التي تبدأ ب "الم"؟', choices: ['البقرة', 'آل عمران', 'العنكبوت', 'جميع ما ذكر'], correct: 3 },
  { question: 'كم جزءاً في القرآن؟', choices: ['30', '20', '25', '15'], correct: 0 },
  { question: 'ما السورة التي تسمى سورة التوحيد؟', choices: ['الإخلاص', 'الفاتحة', 'الناس', 'الفلق'], correct: 0 },
  { question: 'كم عدد سور المدنية في القرآن؟', choices: ['22', '28', '30', '32'], correct: 1 },
  { question: 'ما السورة التي تسمى سنام القرآن؟', choices: ['البقرة', 'آل عمران', 'النساء', 'المائدة'], correct: 0 },
  { question: 'من هو الصحابي الذي جمع القرآن في مصحف واحد؟', choices: ['أبو بكر الصديق', 'عمر بن الخطاب', 'عثمان بن عفان', 'علي بن أبي طالب'], correct: 2 },
  { question: 'في أي سنة توفي النبي صلى الله عليه وسلم؟', choices: ['10 هـ', '11 هـ', '12 هـ', '13 هـ'], correct: 1 },
  { question: 'كم عدد السجدات في القرآن؟', choices: ['12', '14', '15', '16'], correct: 2 },
  { question: 'ما السورة التي تسمى سورة الحواريين؟', choices: ['الصف', 'المائدة', 'آل عمران', 'الأنفال'], correct: 0 },
  { question: 'أي الأنبياء ذكر في القرآن 25 مرة؟', choices: ['موسى', 'إبراهيم', 'نوح', 'آدم'], correct: 2 },
  { question: 'ما معنى كلمة "الرحمن"؟', choices: ['الرحيم', 'شديد الرحمة', 'ذو الرحمة الواسعة', 'الراحم'], correct: 2 },
];

const medium: Question[] = [
  { question: 'ما السورة التي كل آياتها تنتهي بحرف "الدال"؟', choices: ['الإخلاص', 'المسد', 'الفاتحة', 'النصر'], correct: 0 },
  { question: 'أين نزلت سورة مريم؟', choices: ['مكة', 'المدينة', 'القدس', 'الطائف'], correct: 0 },
  { question: 'ما اسم السورة التي تسمى الفاضحة؟', choices: ['المنافقون', 'التوبة', 'الممتحنة', 'التحريم'], correct: 3 },
  { question: 'كم كلمة في القرآن الكريم؟', choices: ['حوالي 67000', 'حوالي 77000', 'حوالي 87000', 'حوالي 97000'], correct: 1 },
  { question: 'ما السورة التي تسمى سورة الأعراف نسبة إلى؟', choices: ['جبل في الجنة', 'حاجز بين الجنة والنار', 'واد في جهنم', 'قبيلة عربية'], correct: 1 },
  { question: 'كم عدد المرات التي ذكر فيها اسم "محمد" في القرآن؟', choices: ['2', '3', '4', '5'], correct: 2 },
  { question: 'ما اسم السورة التي تبدأ بـ "سبح"؟', choices: ['الأعلى', 'الجمعة', 'التغابن', 'جميع ما ذكر'], correct: 3 },
  { question: 'كم عدد الأنبياء المذكورين في القرآن؟', choices: ['20', '25', '28', '30'], correct: 1 },
  { question: 'ما معنى كلمة "الزقوم"؟', choices: ['ثمر الجنة', 'شجرة في جهنم', 'نهر في الجنة', 'طعام أهل الجنة'], correct: 1 },
  { question: 'كم عدد سور القرآن التي تبدأ بـ "الحمد لله"؟', choices: ['3', '4', '5', '6'], correct: 2 },
  { question: 'ما السورة التي نزلت في أبي لهب وزوجته؟', choices: ['المسد', 'الناس', 'الفلق', 'الكافرون'], correct: 0 },
  { question: 'أي سورة تسمى سورة النساء الكبرى؟', choices: ['النساء', 'البقرة', 'المائدة', 'الأحزاب'], correct: 0 },
  { question: 'ما عدد آيات سورة يس؟', choices: ['80', '83', '86', '89'], correct: 1 },
  { question: 'من هو النبي الذي ذكر في القرآن أكثر من غيره؟', choices: ['موسى', 'إبراهيم', 'نوح', 'يوسف'], correct: 0 },
  { question: 'ما السورة التي تسمى سورة النعم؟', choices: ['النحل', 'الأنعام', 'النمل', 'العنكبوت'], correct: 0 },
  { question: 'كم عدد الحروف المقطعة في القرآن؟', choices: ['12', '13', '14', '15'], correct: 2 },
  { question: 'ما السورة التي تبدأ بـ "ألم غلبت الروم"؟', choices: ['الروم', 'الأنبياء', 'الحج', 'المؤمنون'], correct: 0 },
  { question: 'أين ذُكرت قصة أصحاب الكهف؟', choices: ['سورة الكهف', 'سورة الإسراء', 'سورة الأنبياء', 'سورة المؤمنون'], correct: 0 },
  { question: 'ما السورة التي ورد فيها ذكر "السراج المنير"؟', choices: ['الأحزاب', 'النور', 'المزمل', 'المدثر'], correct: 0 },
  { question: 'من هو النبي الذي ابتلعه الحوت؟', choices: ['يونس', 'يوسف', 'يعقوب', 'إسماعيل'], correct: 0 },
  { question: 'كم عدد آيات سورة الملك؟', choices: ['30', '33', '36', '39'], correct: 0 },
  { question: 'ما السورة التي تسمى سورة بني إسرائيل؟', choices: ['الإسراء', 'البقرة', 'آل عمران', 'المائدة'], correct: 0 },
  { question: 'كم سجدة تلاوة في القرآن؟', choices: ['12', '13', '14', '15'], correct: 3 },
  { question: 'ما السورة التي تبدأ بـ "تبارك"؟', choices: ['الملك', 'الفرقان', 'الحشر', 'السجدة'], correct: 0 },
  { question: 'ما طول مدة نزول القرآن؟', choices: ['20 سنة', '23 سنة', '25 سنة', '22 سنة'], correct: 1 },
  { question: 'كم عدد السور التي تبدأ بـ "طس"؟', choices: ['سورة واحدة', 'سورتان', 'ثلاث سور', 'أربع سور'], correct: 1 },
  { question: 'ما معنى "الم"؟', choices: ['الله أعلم بمراده', 'ألف لام ميم', 'اسم من أسماء الله', 'حروف مقطعة'], correct: 0 },
  { question: 'أي سورة تسمى سورة الموعظة؟', choices: ['يونس', 'هود', 'يوسف', 'الحجر'], correct: 1 },
  { question: 'كم عدد السور المكية؟', choices: ['82', '86', '85', '80'], correct: 1 },
  { question: 'ما السورة التي تسمى سورة الفرائض؟', choices: ['النساء', 'البقرة', 'المائدة', 'الأنفال'], correct: 0 },
];

const hard: Question[] = [
  { question: 'كم عدد أحرف القرآن الكريم؟', choices: ['حوالي 320000', 'حوالي 330000', 'حوالي 340000', 'حوالي 350000'], correct: 0 },
  { question: 'ما اسم السورة التي تسمى سورة العقود؟', choices: ['البقرة', 'آل عمران', 'النساء', 'المائدة'], correct: 3 },
  { question: 'كم سورة في القرآن لم يرد فيها لفظ الجلالة "الله"؟', choices: ['26', '27', '28', '29'], correct: 2 },
  { question: 'ما اسم السورة التي تبدأ بـ "سورة"؟', choices: ['النور', 'الجمعة', 'المائدة', 'التحريم'], correct: 0 },
  { question: 'أي سورة تسمى سورة التوديع؟', choices: ['النصر', 'المائدة', 'الجمعة', 'التوبة'], correct: 0 },
  { question: 'كم عدد آيات سورة آل عمران؟', choices: ['200', '250', '196', '210'], correct: 0 },
  { question: 'ما السورة التي ورد فيها ذكر الغار؟', choices: ['التوبة', 'الأنفال', 'آل عمران', 'البقرة'], correct: 0 },
  { question: 'أي سورة تسمى سورة النساء الصغرى؟', choices: ['الطلاق', 'التحريم', 'المجادلة', 'الممتحنة'], correct: 0 },
  { question: 'ما السورة التي تسمى سورة القتال؟', choices: ['محمد', 'الأنفال', 'آل عمران', 'التوبة'], correct: 0 },
  { question: 'كم عدد السور التي تبدأ بـ "حم"؟', choices: ['5', '6', '7', '8'], correct: 2 },
  { question: 'ما معنى كلمة "طه"؟', choices: ['يا رجل', 'يا نبي', 'يا محمد', 'من المتشابه'], correct: 3 },
  { question: 'ما السورة التي تسمى سورة المؤمن؟', choices: ['غافر', 'المؤمنون', 'الحاقة', 'الزمر'], correct: 0 },
  { question: 'كم عدد السور القرآنية التي سميت بأسماء الأنبياء؟', choices: ['7', '8', '9', '10'], correct: 1 },
  { question: 'أي سورة تبدأ بـ "عسق"؟', choices: ['الشورى', 'الصافات', 'الزخرف', 'ق'], correct: 0 },
  { question: 'ما عدد السجدات الواجبة في القرآن عند الشافعية؟', choices: ['11', '12', '13', '14'], correct: 2 },
  { question: 'ما السورة التي تسمى سورة النساء الصغرى؟', choices: ['الطلاق', 'التحريم', 'المجادلة', 'الممتحنة'], correct: 0 },
  { question: 'كم مرة تكررت كلمة "قل" في القرآن؟', choices: ['332', '342', '352', '362'], correct: 2 },
  { question: 'أي سورة تسمى سورة التثبيت؟', choices: ['الفرقان', 'محمد', 'الأحزاب', 'الأنفال'], correct: 3 },
  { question: 'ما السورة التي تسمى سورة السؤال؟', choices: ['المعارج', 'النازعات', 'الملك', 'المعارج'], correct: 0 },
  { question: 'من هو النبي الذي تمنى الموت في القرآن؟', choices: ['يوسف', 'أيوب', 'مريم', 'يعقوب'], correct: 0 },
  { question: 'كم عدد سور القرآن التي تبدأ بالقسم؟', choices: ['12', '13', '14', '15'], correct: 3 },
  { question: 'ما السورة التي تسمى سورة الدين؟', choices: ['الماعون', 'الزلزلة', 'التين', 'الواقعة'], correct: 0 },
  { question: 'ما معنى "عسق"؟', choices: ['حروف مقطعة', 'اسم من أسماء الله', 'قسم من الله', 'لا يعلم تأويلها إلا الله'], correct: 0 },
  { question: 'كم عدد المواضع التي وردت فيها سجدة التلاوة في القرآن؟', choices: ['13', '14', '15', '16'], correct: 2 },
  { question: 'أي آية في القرآن تسمى آية المباهلة؟', choices: ['آل عمران 61', 'المائدة 6', 'البقرة 89', 'آل عمران 7'], correct: 0 },
  { question: 'ما عدد السور القرآنية التي لا تبدأ بالبسملة؟', choices: ['سورة واحدة', 'سورتان', '3', '4'], correct: 0 },
  { question: 'كم عدد السور التي سميت بأيام الأسبوع؟', choices: ['سورة واحدة', 'سورتان', 'لا يوجد', '3'], correct: 0 },
  { question: 'ما السورة التي تسمى سورة الصف؟', choices: ['الصف', 'الجمعة', 'المنافقون', 'التغابن'], correct: 0 },
  { question: 'أي سورة تبدأ بـ "إنا"؟', choices: ['الفتح', 'الكوثر', 'القدر', 'جميع ما ذكر'], correct: 3 },
  { question: 'كم عدد آيات سورة البقرة؟', choices: ['286', '285', '287', '290'], correct: 0 },
];

const questionPool: Record<string, Question[]> = { سهل: easy, متوسط: medium, صعب: hard };

async function ensureUser(userId: string, username: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: { username },
    create: { id: userId, username },
  });
  await prisma.userPoint.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

function getLevel(total: number) {
  let current = levels[0];
  for (const l of levels) {
    if (total >= l.minPoints) current = l;
  }
  return current;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default {
  data: new SlashCommandBuilder()
    .setName('مسابقة-قرآن')
    .setDescription('اختبر معلوماتك القرآنية')
    .addStringOption(option =>
      option.setName('المستوى')
        .setDescription('اختر مستوى الصعوبة')
        .setRequired(true)
        .addChoices(
          { name: 'سهل', value: 'سهل' },
          { name: 'متوسط', value: 'متوسط' },
          { name: 'صعب', value: 'صعب' },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    const level = interaction.options.getString('المستوى', true) as keyof typeof questionPool;
    const pool = questionPool[level];

    if (!pool || pool.length === 0) {
      await interaction.reply({ embeds: [errorEmbed('حدث خطأ في تحميل الأسئلة.')], flags: 64 });
      return;
    }

    const question = pool[Math.floor(Math.random() * pool.length)];
    const shuffled = shuffle(question.choices.map((text, idx) => ({ text, origIdx: idx })));
    const correctIdx = shuffled.findIndex(s => s.origIdx === question.correct);

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < 4; i += 2) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      for (let j = i; j < i + 2 && j < 4; j++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`quiz_${j}`)
            .setLabel(`${String.fromCharCode(0x0660 + j + 1)}) ${shuffled[j].text}`)
            .setStyle(ButtonStyle.Primary),
        );
      }
      rows.push(row);
    }

    const embed = buildEmbed('games', {
      title: `📖 مسابقة قرآنية (${level})`,
      description: `**${question.question}**`,
      footer: 'اضغط على الإجابة الصحيحة • لديك 30 ثانية',
    });

    const reply = await interaction.reply({
      embeds: [embed],
      components: rows,
      fetchReply: true,
    });

    const filter = (i: any) => i.user.id === interaction.user.id;
    try {
      const collected = await reply.awaitMessageComponent({
        filter,
        componentType: ComponentType.Button,
        time: 30000,
      });

      const chosen = parseInt(collected.customId.replace('quiz_', ''));
      const isCorrect = chosen === correctIdx;

      await ensureUser(interaction.user.id, interaction.user.username);

      const points = isCorrect ? 10 : -3;
      const levelMap: Record<string, number> = { سهل: 5, متوسط: 3, صعب: 1 };
      const correctBonus = isCorrect ? (levelMap[level] || 0) : 0;

      await prisma.gameScore.create({
        data: {
          userId: interaction.user.id,
          gameType: 'quran-quiz',
          score: isCorrect ? 10 + correctBonus : 0,
          correct: isCorrect ? 1 : 0,
          wrong: isCorrect ? 0 : 1,
        },
      });

      const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
      const newTotal = (userPoint?.total || 0) + points;
      const newGamePts = (userPoint?.gamePts || 0) + points;

      const currentLevel = getLevel(newTotal);

      await prisma.userPoint.update({
        where: { userId: interaction.user.id },
        data: {
          total: newTotal,
          gamePts: Math.max(0, newGamePts),
          level: currentLevel.name,
        },
      });

      const resultEmbed = buildEmbed('games', {
        title: isCorrect ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة',
        description: isCorrect
          ? `أحسنت! الإجابة الصحيحة: **${question.choices[question.correct]}**\n+${10 + correctBonus} نقطة`
          : `الإجابة الصحيحة: **${question.choices[question.correct]}**\n${points} نقطة`,
        fields: [
          { name: 'إجمالي النقاط', value: `${newTotal}`, inline: true },
          { name: 'المستوى', value: currentLevel.name, inline: true },
        ],
      });

      await collected.update({ embeds: [resultEmbed], components: [] });
    } catch {
      const timeoutEmbed = buildEmbed('games', {
        title: '⏰ انتهى الوقت',
        description: `الإجابة الصحيحة: **${question.choices[question.correct]}**`,
      });
      await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
    }
  },
  category: 'games',
} as Command;
