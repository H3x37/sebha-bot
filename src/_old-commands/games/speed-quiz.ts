import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

interface SpeedQuestion {
  question: string;
  choices: string[];
  correct: number;
}

const bank: SpeedQuestion[] = [
  { question: 'كم عدد أركان الإسلام؟', choices: ['3', '4', '5', '6'], correct: 2 },
  { question: 'كم عدد أركان الإيمان؟', choices: ['4', '5', '6', '7'], correct: 2 },
  { question: 'ما أول سورة في القرآن؟', choices: ['البقرة', 'الفاتحة', 'العلق', 'الناس'], correct: 1 },
  { question: 'كم عدد أجزاء القرآن؟', choices: ['20', '25', '30', '60'], correct: 2 },
  { question: 'ما أعظم آية في القرآن؟', choices: ['آية الكرسي', 'آية الدين', 'آية الميراث', 'آية النور'], correct: 0 },
  { question: 'ما السورة التي تسمى قلب القرآن؟', choices: ['يس', 'الرحمن', 'البقرة', 'الإخلاص'], correct: 0 },
  { question: 'كم عدد الأنبياء المذكورين في القرآن؟', choices: ['25', '28', '30', '124000'], correct: 0 },
  { question: 'ما أطول سورة في القرآن؟', choices: ['آل عمران', 'البقرة', 'النساء', 'الأعراف'], correct: 1 },
  { question: 'ما أقصر سورة في القرآن؟', choices: ['الإخلاص', 'الكوثر', 'العصر', 'النصر'], correct: 1 },
  { question: 'في أي ليلة نزل القرآن؟', choices: ['ليلة القدر', 'ليلة الإسراء', 'ليلة المعراج', 'ليلة الجمعة'], correct: 0 },
  { question: 'ما السورة التي تعدل ثلث القرآن؟', choices: ['الفاتحة', 'الإخلاص', 'يس', 'الملك'], correct: 1 },
  { question: 'من أول الأنبياء؟', choices: ['نوح', 'إبراهيم', 'آدم', 'موسى'], correct: 2 },
  { question: 'من خاتم الأنبياء؟', choices: ['عيسى', 'محمد ﷺ', 'موسى', 'إبراهيم'], correct: 1 },
  { question: 'أين نزل الوحي أول مرة؟', choices: ['غار ثور', 'غار حراء', 'المسجد الحرام', 'المسجد الأقصى'], correct: 1 },
  { question: 'كم مرة ذكرت كلمة "الدنيا" في القرآن؟', choices: ['100', '115', '120', '145'], correct: 1 },
  { question: 'كم مرة ذكرت كلمة "الآخرة" في القرآن؟', choices: ['100', '115', '120', '145'], correct: 1 },
  { question: 'ما السورة التي تسمى عروس القرآن؟', choices: ['الرحمن', 'يس', 'طه', 'الملك'], correct: 0 },
  { question: 'كم عدد السجدات في القرآن؟', choices: ['11', '13', '15', '17'], correct: 2 },
  { question: 'من أول من آمن من الرجال؟', choices: ['عمر', 'علي', 'أبو بكر', 'حمزة'], correct: 2 },
  { question: 'من أول من آمن من النساء؟', choices: ['فاطمة', 'عائشة', 'خديجة', 'مريم'], correct: 2 },
  { question: 'ما السورة التي بدأت بـ "الم"؟', choices: ['البقرة فقط', 'آل عمران فقط', 'البقرة وآل عمران', 'العنكبوت فقط'], correct: 2 },
  { question: 'ما أكبر آية في القرآن؟', choices: ['آية الكرسي', 'آية الدين', 'آية الميراث', 'آية النور'], correct: 1 },
  { question: 'كم عدد سور القرآن؟', choices: ['112', '113', '114', '115'], correct: 2 },
  { question: 'كم عدد أحزاب القرآن؟', choices: ['30', '40', '50', '60'], correct: 3 },
  { question: 'ما السورة التي تبدأ بالتسمية مرتين؟', choices: ['التوبة', 'الفاتحة', 'النمل', 'البقرة'], correct: 2 },
  { question: 'ما السورة التي لم تبدأ بالبسملة؟', choices: ['التوبة', 'النمل', 'الفاتحة', 'البقرة'], correct: 0 },
  { question: 'من أول من كتب الوحي؟', choices: ['عمر بن الخطاب', 'أبو بكر الصديق', 'عثمان بن عفان', 'علي بن أبي طالب'], correct: 2 },
  { question: 'في أي غزوة نزل قوله تعالى "ويوم حنين إذ أعجبتكم كثرتكم"؟', choices: ['بدر', 'أحد', 'حنين', 'الخندق'], correct: 2 },
  { question: 'كم مرة ورد اسم محمد في القرآن؟', choices: ['2', '4', '6', '8'], correct: 1 },
  { question: 'ما الحرف الذي لم يرد في سورة الفاتحة؟', choices: ['ف', 'ظ', 'ث', 'خ'], correct: 1 },
  { question: 'ما السورة التي تسمى سورة النساء الصغرى؟', choices: ['الطلاق', 'المجادلة', 'الممتحنة', 'التحريم'], correct: 0 },
  { question: 'كم عدد الغزوات التي شارك فيها النبي ﷺ؟', choices: ['27', '25', '23', '29'], correct: 0 },
  { question: 'كم عدد أحاديث صحيح البخاري تقريباً؟', choices: ['7000', '6000', '8000', '9000'], correct: 0 },
  { question: 'ما السورة التي كانت سبب إسلام عمر بن الخطاب؟', choices: ['البقرة', 'طه', 'يس', 'مريم'], correct: 1 },
  { question: 'من أول من جهر بالقرآن في مكة؟', choices: ['عمر', 'عبد الله بن مسعود', 'حمزة', 'أبو بكر'], correct: 1 },
  { question: 'كم سنة استمر نزول الوحي؟', choices: ['20', '23', '25', '22'], correct: 1 },
  { question: 'في أي ركن تبدأ "لبيك اللهم لبيك"؟', choices: ['الصلاة', 'الصوم', 'الحج', 'الزكاة'], correct: 2 },
  { question: 'من الصحابي الملقب بـ "سيف الله المسلول"؟', choices: ['حمزة', 'خالد بن الوليد', 'عمر', 'أبو عبيدة'], correct: 1 },
  { question: 'ما السورة التي تسمى "براءة"؟', choices: ['الفتح', 'التوبة', 'المائدة', 'الصف'], correct: 1 },
  { question: 'من أول مؤذن في الإسلام؟', choices: ['عمر', 'بلال', 'ابن أم مكتوم', 'أبو محذورة'], correct: 1 },
];

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

const POINTS = 15;

export default {
  data: new SlashCommandBuilder()
    .setName('سباق-السرعة')
    .setDescription('أسئلة دينية سريعة - أجب بأسرع ما يمكن'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    await ensureUser(interaction.user.id, interaction.user.username);

    const questions = bank.sort(() => Math.random() - 0.5).slice(0, 10);
    let current = 0;
    let score = 0;
    let correctCount = 0;

    async function nextQuestion() {
      if (current >= questions.length) {
        const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
        const newTotal = (userPoint?.total || 0) + score;
        const newGamePts = (userPoint?.gamePts || 0) + score;
        await prisma.userPoint.update({
          where: { userId: interaction.user.id },
          data: { total: newTotal, gamePts: newGamePts },
        });

        const embed = buildEmbed('games', {
          title: 'انتهى السباق',
          description: `نتيجتك: **${score}** من **${questions.length * POINTS}** نقطة`,
          fields: [
            { name: 'الإجابات الصحيحة', value: `${correctCount} / ${questions.length}`, inline: true },
            { name: 'النقاط', value: `${score}`, inline: true },
          ],
        });
        await interaction.editReply({ embeds: [embed], components: [] });
        return;
      }

      const q = questions[current];
      const embed = buildEmbed('games', {
        title: `سباق السرعة • سؤال ${current + 1}/${questions.length}`,
        description: `**${q.question}**`,
        fields: [
          { name: 'الوقت', value: '⏱ 15 ثانية', inline: true },
          { name: 'النقاط', value: `${score}`, inline: true },
        ],
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        q.choices.map((choice, i) =>
          new ButtonBuilder()
            .setCustomId(`speed_${i}`)
            .setLabel(choice)
            .setStyle(ButtonStyle.Primary)
        )
      );

      await interaction.editReply({ embeds: [embed], components: [row] });

      const filter = (i: any) => i.user.id === interaction.user.id;
      const collected = await interaction.channel?.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 15000 }).catch(() => null);

      if (!collected) {
        const timeoutEmbed = buildEmbed('games', {
          title: 'انتهى الوقت',
          description: `الإجابة الصحيحة: **${q.choices[q.correct]}**`,
        });
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        current++;
        setTimeout(nextQuestion, 1500);
        return;
      }

      const chosen = parseInt(collected.customId.replace('speed_', ''));
      if (chosen === q.correct) {
        score += POINTS;
        correctCount++;
        const correctEmbed = buildEmbed('games', { title: 'إجابة صحيحة', description: `✅ ${q.choices[q.correct]}` });
        await collected.update({ embeds: [correctEmbed], components: [] });
      } else {
        const wrongEmbed = buildEmbed('games', { title: 'إجابة خاطئة', description: `✅ **${q.choices[q.correct]}**` });
        await collected.update({ embeds: [wrongEmbed], components: [] });
      }

      current++;
      setTimeout(nextQuestion, 1500);
    }

    nextQuestion();
  },
  category: 'games',
} as Command;
