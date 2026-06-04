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
  topic: string;
}

const bank: Question[] = [
  // توحيد
  { question: 'ما معنى التوحيد؟', choices: ['إفراد الله بالعبادة', 'معرفة الله فقط', 'محبة الله', 'ذكر الله'], correct: 0, topic: 'توحيد' },
  { question: 'كم قسمًا من التوحيد؟', choices: ['قسم واحد', 'قسمان', 'ثلاثة أقسام', 'أربعة أقسام'], correct: 2, topic: 'توحيد' },
  { question: 'ما توحيد الربوبية؟', choices: ['إفراد الله بالأفعال', 'إفراد الله بالعبادة', 'إفراد الله بالأسماء', 'إفراد الله بالخلق'], correct: 0, topic: 'توحيد' },
  { question: 'ما التوحيد الذي تضمنته سورة الإخلاص؟', choices: ['توحيد الألوهية', 'توحيد الربوبية', 'توحيد الأسماء والصفات', 'جميع ما ذكر'], correct: 3, topic: 'توحيد' },
  { question: 'ما أعظم ذنب في الإسلام؟', choices: ['الزنا', 'السرقة', 'الشرك بالله', 'عقوق الوالدين'], correct: 2, topic: 'توحيد' },
  { question: 'ما أول واجب على المكلف؟', choices: ['الصلاة', 'الصوم', 'الشهادتان', 'الحج'], correct: 2, topic: 'توحيد' },
  { question: 'من أقسام التوحيد: توحيد...', choices: ['العبادة', 'الألوهية', 'الأسماء والصفات', 'جميع ما ذكر'], correct: 3, topic: 'توحيد' },
  { question: 'ما معنى "لا إله إلا الله"؟', choices: ['لا معبود بحق إلا الله', 'لا خالق إلا الله', 'لا رب إلا الله', 'لا موجود إلا الله'], correct: 0, topic: 'توحيد' },

  // فقه
  { question: 'ما حكم الوضوء عند وجود الحدث؟', choices: ['سنة', 'مستحب', 'واجب', 'مندوب'], correct: 2, topic: 'فقه' },
  { question: 'كم عدد فروض الوضوء؟', choices: ['أربعة', 'خمسة', 'ستة', 'سبعة'], correct: 2, topic: 'فقه' },
  { question: 'كم عدد أركان الصلاة؟', choices: ['أحد عشر', 'أربعة عشر', 'اثنا عشر', 'خمسة عشر'], correct: 1, topic: 'فقه' },
  { question: 'ما حكم الجمعة على المسافر؟', choices: ['فرض', 'سنة', 'لا تجب', 'محرمة'], correct: 2, topic: 'فقه' },
  { question: 'صلاة الوتر كم أقلها؟', choices: ['ركعة', 'ركعتان', 'ثلاث', 'خمس'], correct: 0, topic: 'فقه' },
  { question: 'ما حكم أكل الميتة للمضطر؟', choices: ['حرام', 'مباح بقدر الضرورة', 'مكروه', 'سنة'], correct: 1, topic: 'فقه' },
  { question: 'كم مقدار زكاة الفطر؟', choices: ['مد', 'صاع', 'كيلو', 'نصف صاع'], correct: 1, topic: 'فقه' },
  { question: 'ما مبطلات الصيام؟', choices: ['الأكل ناسياً', 'الجماع عمداً', 'القيء بغير عمد', 'الحلم'], correct: 1, topic: 'فقه' },
  { question: 'ما حكم المسح على الخفين في الوضوء؟', choices: ['جائز', 'واجب', 'سنة', 'بدعة'], correct: 0, topic: 'فقه' },
  { question: 'كم عدد مصارف الزكاة؟', choices: ['ستة', 'سبعة', 'ثمانية', 'تسعة'], correct: 2, topic: 'فقه' },
  { question: 'ما حكم الصلاة في الثوب النجس؟', choices: ['تصح مع الكراهة', 'لا تصح', 'تصح مطلقاً', 'تصح مع الجهل'], correct: 1, topic: 'فقه' },
  { question: 'صلاة الضحى وقتها؟', choices: ['بعد الفجر', 'بعد الشروق إلى قبل الظهر', 'بعد الظهر', 'قبل المغرب'], correct: 1, topic: 'فقه' },

  // تفسير
  { question: 'ما معنى "الرحمن" في سورة الفاتحة؟', choices: ['الراحم', 'شديد الرحمة', 'ذي الرحمة الواسعة', 'الراحم لعباده'], correct: 2, topic: 'تفسير' },
  { question: 'سورة الكوثر نزلت في...', choices: ['الرد على المشركين', 'فضائل النبي', 'العاص بن وائل', 'الصحابة'], correct: 2, topic: 'تفسير' },
  { question: 'ما معنى "الم"؟', choices: ['حروف مقطعة الله أعلم بها', 'ألف لام ميم', 'اسم من أسماء الله', 'قسم'], correct: 0, topic: 'تفسير' },
  { question: '"الرجز" في سورة المدثر ما معناه؟', choices: ['الشرك', 'الذنب', 'الأصنام', 'الخمر'], correct: 2, topic: 'تفسير' },
  { question: 'ما تفسير "الحاقة"؟', choices: ['يوم القيامة', 'يوم الحساب', 'الحق الثابت', 'الواقعة'], correct: 2, topic: 'تفسير' },
  { question: '"وطور سينين" ما معناها؟', choices: ['جبل في الدنيا', 'الجبل الذي كلم الله عليه موسى', 'جبل في الجنة', 'جبل في مكة'], correct: 1, topic: 'تفسير' },
  { question: 'ما معنى "التكاثر" في سورة التكاثر؟', choices: ['كثرة المال', 'التفاخر بالأموال والأولاد', 'كثرة العبادة', 'كثرة العلم'], correct: 1, topic: 'تفسير' },
  { question: 'ما معنى "الطارق"؟', choices: ['النجم المضيء', 'النجم الثاقب', 'الملك', 'الملاك'], correct: 1, topic: 'تفسير' },

  // حديث
  { question: 'أول من يشفع للنبي صلى الله عليه وسلم...', choices: ['الصحابة', 'القرآن', 'أمته', 'الأنبياء'], correct: 1, topic: 'حديث' },
  { question: 'ما حكم رفع الصوت في المسجد؟', choices: ['جائز', 'حرام', 'مكروه', 'مندوب'], correct: 2, topic: 'حديث' },
  { question: 'قال النبي صلى الله عليه وسلم: "الدين النصيحة" لمن؟', choices: ['لله ورسوله وللمسلمين', 'لله وللمؤمنين', 'لله وللناس', 'لله وللصحابة'], correct: 0, topic: 'حديث' },
  { question: 'من الذي قال له النبي صلى الله عليه وسلم: "لا تغضب"؟', choices: ['أبو هريرة', 'أبو ذر', 'أبو الدرداء', 'أنس بن مالك'], correct: 1, topic: 'حديث' },
  { question: 'ما هو الحديث القدسي؟', choices: ['حديث يرويه النبي عن الله', 'حديث صحيح', 'حديث متواتر', 'حديث قديم'], correct: 0, topic: 'حديث' },
  { question: 'كم عدد أحاديث الأربعين النووية؟', choices: ['40', '41', '42', '43'], correct: 2, topic: 'حديث' },
  { question: 'من هو راوي أكثر الأحاديث؟', choices: ['ابن عباس', 'عائشة', 'أبو هريرة', 'أنس بن مالك'], correct: 2, topic: 'حديث' },
  { question: 'ما أول ما بدئ به الوحي؟', choices: ['الرؤيا الصالحة', 'الاحلام', 'الإلهام', 'السماع'], correct: 0, topic: 'حديث' },

  // سيرة
  { question: 'في أي عام ولد النبي صلى الله عليه وسلم؟', choices: ['عام الفيل', 'عام الحزن', 'عام الوفود', 'عام الفتح'], correct: 0, topic: 'سيرة' },
  { question: 'من هي مرضعة النبي صلى الله عليه وسلم؟', choices: ['أم أيمن', 'حليمة السعدية', 'ثويبة', 'سودة'], correct: 1, topic: 'سيرة' },
  { question: 'أين كانت الهجرة الأولى للمسلمين؟', choices: ['المدينة', 'الحبشة', 'الطائف', 'مصر'], correct: 1, topic: 'سيرة' },
  { question: 'كم سنة دامت الدعوة في مكة؟', choices: ['10 سنوات', '13 سنة', '15 سنة', '20 سنة'], correct: 1, topic: 'سيرة' },
  { question: 'في أي غزوة استشهد حمزة؟', choices: ['بدر', 'أحد', 'الخندق', 'خيبر'], correct: 1, topic: 'سيرة' },
  { question: 'من هي أول من آمن بالنبي من النساء؟', choices: ['عائشة', 'خديجة', 'فاطمة', 'أم سلمة'], correct: 1, topic: 'سيرة' },
  { question: 'كم عدد غزوات النبي؟', choices: ['19', '25', '27', '30'], correct: 2, topic: 'سيرة' },
  { question: 'من هو الصحابي الذي اهتز لموته عرش الرحمن؟', choices: ['عمر', 'عثمان', 'علي', 'سعد بن معاذ'], correct: 3, topic: 'سيرة' },
];

const topicKeys = ['توحيد', 'فقه', 'تفسير', 'حديث', 'سيرة'];

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
    .setName('اختبار-ديني')
    .setDescription('اختبار ديني في مواد مختلفة')
    .addStringOption(option =>
      option.setName('المادة')
        .setDescription('اختر المادة')
        .setRequired(true)
        .addChoices(
          { name: 'توحيد', value: 'توحيد' },
          { name: 'فقه', value: 'فقه' },
          { name: 'تفسير', value: 'تفسير' },
          { name: 'حديث', value: 'حديث' },
          { name: 'سيرة', value: 'سيرة' },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    const topic = interaction.options.getString('المادة', true);
    const pool = bank.filter(q => q.topic === topic);

    if (pool.length < 5) {
      await interaction.reply({ embeds: [errorEmbed('لا يوجد عدد كافٍ من الأسئلة لهذه المادة.')], flags: 64 });
      return;
    }

    const questions = shuffle(pool).slice(0, 5);
    let current = 0;
    let correctCount = 0;
    let answered = false;

    async function showQuestion() {
      if (current >= questions.length) return null;

      const q = questions[current];
      const rows: ActionRowBuilder<ButtonBuilder>[] = [];

      for (let i = 0; i < 4; i += 2) {
        const row = new ActionRowBuilder<ButtonBuilder>();
        for (let j = i; j < i + 2 && j < 4; j++) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`test_${j}`)
              .setLabel(`${String.fromCharCode(0x0660 + j + 1)}) ${q.choices[j]}`)
              .setStyle(ButtonStyle.Primary),
          );
        }
        rows.push(row);
      }

      const embed = buildEmbed('games', {
        title: `📝 اختبار ${topic} (سؤال ${current + 1}/5)`,
        description: `**${q.question}**`,
        footer: `لديك 30 ثانية للإجابة`,
      });

      return { embeds: [embed], components: rows };
    }

    const firstMsg = await showQuestion();
    if (!firstMsg) {
      await interaction.reply({ embeds: [errorEmbed('حدث خطأ في تحميل الأسئلة.')], flags: 64 });
      return;
    }

    const reply = await interaction.reply({ ...firstMsg, fetchReply: true });

    const filter = (i: any) => i.user.id === interaction.user.id;

    while (current < questions.length) {
      try {
        const collected = await reply.awaitMessageComponent({
          filter,
          componentType: ComponentType.Button,
          time: 30000,
        });

        if (answered) {
          await collected.deferUpdate();
          continue;
        }
        answered = true;

        const chosen = parseInt(collected.customId.replace('test_', ''));
        const q = questions[current];
        const isCorrect = chosen === q.correct;
        if (isCorrect) correctCount++;

        const status = isCorrect ? '✅ صحيح' : `❌ خطأ • الإجابة: **${q.choices[q.correct]}**`;
        const progress = `**${correctCount}/${current + 1}**`;

        const embed = buildEmbed('games', {
          title: `📝 اختبار ${topic}`,
          description: `**${q.question}**`,
          fields: [
            { name: status, value: `التقدم: ${progress}` },
          ],
        });

        await collected.update({ embeds: [embed], components: [] });

        current++;
        if (current >= questions.length) break;

        await new Promise(res => setTimeout(res, 1500));
        answered = false;

        const nextMsg = await showQuestion();
        if (nextMsg) {
          await interaction.editReply(nextMsg);
        }
      } catch {
        await ensureUser(interaction.user.id, interaction.user.username);

        const points = correctCount * 10;
        const wrongCount = current + (current < questions.length ? questions.length - current : 0) - correctCount;

        await prisma.gameScore.create({
          data: {
            userId: interaction.user.id,
            gameType: 'islamic-test',
            score: points,
            correct: correctCount,
            wrong: wrongCount,
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
            gamePts: newGamePts,
            level: currentLevel.name,
          },
        });

        const timeoutEmbed = buildEmbed('games', {
          title: '⏰ انتهى الاختبار',
          description: `الإجابات الصحيحة: **${correctCount}/5**`,
          fields: [
            { name: 'النقاط', value: `+${points}`, inline: true },
            { name: 'المستوى', value: currentLevel.name, inline: true },
          ],
        });
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        return;
      }
    }

    await ensureUser(interaction.user.id, interaction.user.username);

    const points = correctCount * 10;
    const wrongCount = 5 - correctCount;

    await prisma.gameScore.create({
      data: {
        userId: interaction.user.id,
        gameType: 'islamic-test',
        score: points,
        correct: correctCount,
        wrong: wrongCount,
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
        gamePts: newGamePts,
        level: currentLevel.name,
      },
    });

    const finalEmbed = buildEmbed('games', {
      title: '✅ انتهى الاختبار!',
      description: `**${topic}**`,
      fields: [
        { name: 'الإجابات الصحيحة', value: `${correctCount}/5`, inline: true },
        { name: 'النقاط المكتسبة', value: `+${points}`, inline: true },
        { name: 'المستوى', value: currentLevel.name, inline: true },
        { name: 'الدرجة', value: `${(correctCount / 5) * 100}%`, inline: true },
      ],
    });

    await interaction.editReply({ embeds: [finalEmbed], components: [] });
  },
  category: 'games',
} as Command;
