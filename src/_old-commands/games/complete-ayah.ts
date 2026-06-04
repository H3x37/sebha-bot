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

interface AyahQuestion {
  start: string;
  completion: string;
  surah: string;
  choices: string[];
  correct: number;
}

const questions: AyahQuestion[] = [
  {
    start: 'إِيَّاكَ نَعْبُدُ',
    completion: 'وَإِيَّاكَ نَسْتَعِينُ',
    surah: 'الفاتحة',
    choices: ['وإياك نستعين', 'وإياك نستغفر', 'وإياك نتوكل', 'وإياك نسأل'],
    correct: 0,
  },
  {
    start: 'اهدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    completion: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ',
    surah: 'الفاتحة',
    choices: ['صراط الذين أنعمت عليهم', 'صراط المؤمنين', 'صراط الذين أنعمت عليهم غير المغضوب عليهم', 'صراط الأنبياء'],
    correct: 2,
  },
  {
    start: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ',
    completion: 'وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ',
    surah: 'البقرة - آية الكرسي',
    choices: ['ولا نوم له ما في السماوات وما في الأرض', 'ولا نوم وهو العلي العظيم', 'ولا نوم وهو على كل شيء قدير', 'ولا نوم وهو السميع العليم'],
    correct: 0,
  },
  {
    start: 'إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ',
    completion: 'الْعُلَمَاءُ ۗ إِنَّ اللَّهَ عَزِيزٌ غَفُورٌ',
    surah: 'فاطر',
    choices: ['العلماء', 'المؤمنون', 'الصالحون', 'المتقون'],
    correct: 0,
  },
  {
    start: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
    completion: 'وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    surah: 'البقرة',
    choices: ['واشكروا لي ولا تكفرون', 'واشكروا لي وأحسنوا', 'واشكروا لي واتقون', 'واشكروا لي وارحمون'],
    correct: 0,
  },
  {
    start: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ',
    completion: 'وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    surah: 'البقرة',
    choices: ['والصلاة إن الله مع الصابرين', 'والصلاة إن الله غفور رحيم', 'والصلاة إن الله سميع عليم', 'والصلاة إن الله عزيز حكيم'],
    correct: 0,
  },
  {
    start: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ',
    completion: 'حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ ۚ قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا',
    surah: 'الطلاق',
    choices: ['حسبه إن الله بالغ أمره', 'كافيه إن الله ناصر أمره', 'حسبه إن الله لطيف خبير', 'كافيه إن الله قوي عزيز'],
    correct: 0,
  },
  {
    start: 'رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ',
    completion: 'أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا',
    surah: 'البقرة',
    choices: ['أخطأنا', 'ظلمنا', 'جهلنا', 'غفلنا'],
    correct: 0,
  },
  {
    start: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ',
    completion: 'مِن مُّدَّكِرٍ',
    surah: 'القمر',
    choices: ['من مدكر', 'من شاكر', 'من متعظ', 'من ذاكر'],
    correct: 0,
  },
  {
    start: 'فَإِنَّ مَعَ الْعُسْرِ',
    completion: 'يُسْرًا',
    surah: 'الشرح',
    choices: ['يسراً', 'فرجاً', 'رحمة', 'خيراً'],
    correct: 0,
  },
  {
    start: 'إِنَّ رَحْمَتَ اللَّهِ قَرِيبٌ مِّنَ',
    completion: 'الْمُحْسِنِينَ',
    surah: 'الأعراف',
    choices: ['المحسنين', 'المتقين', 'المؤمنين', 'الصابرين'],
    correct: 0,
  },
  {
    start: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ',
    completion: 'وَبِالْوَالِدَيْنِ إِحْسَانًا',
    surah: 'الإسراء',
    choices: ['وبالوالدين إحساناً', 'وبالوالدين براً', 'وبالوالدين خيراً', 'وبالوالدين طاعة'],
    correct: 0,
  },
  {
    start: 'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ ۖ إِنَّهُ لَا يَيْأَسُ مِن رَّوْحِ اللَّهِ إِلَّا',
    completion: 'الْقَوْمُ الْكَافِرُونَ',
    surah: 'يوسف',
    choices: ['القوم الكافرون', 'القوم الظالمون', 'القوم الخاسرون', 'القوم الضالون'],
    correct: 0,
  },
  {
    start: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    completion: 'اللَّهُ الصَّمَدُ',
    surah: 'الإخلاص',
    choices: ['الله الصمد', 'الله الواحد', 'الله الفرد', 'الله الأحد'],
    correct: 0,
  },
  {
    start: 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا',
    completion: 'لِيَعْبُدُونِ',
    surah: 'الذاريات',
    choices: ['ليعبدون', 'ليرحمون', 'ليؤمنون', 'ليطيعون'],
    correct: 0,
  },
  {
    start: 'إِنَّ اللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ',
    completion: 'أَهْلِهَا',
    surah: 'النساء',
    choices: ['أهلها', 'أصحابها', 'المؤمنين', 'المسلمين'],
    correct: 0,
  },
  {
    start: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ',
    completion: 'مَخْرَجًا',
    surah: 'الطلاق',
    choices: ['مخرجاً', 'فرجاً', 'خيراً', 'أجراً'],
    correct: 0,
  },
  {
    start: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً',
    completion: 'وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    surah: 'البقرة',
    choices: ['وفي الآخرة حسنة وقنا عذاب النار', 'وفي الآخرة حسنة وارحمنا', 'وفي الآخرة حسنة واغفر لنا', 'وفي الآخرة حسنة وأدخلنا الجنة'],
    correct: 0,
  },
  {
    start: 'وَالْعَصْرِ * إِنَّ الْإِنسَانَ لَفِي',
    completion: 'خُسْرٍ',
    surah: 'العصر',
    choices: ['خسر', 'عسر', 'ضلال', 'لهو'],
    correct: 0,
  },
  {
    start: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ',
    completion: 'الصَّادِقِينَ',
    surah: 'التوبة',
    choices: ['الصادقين', 'الصابرين', 'المؤمنين', 'المتقين'],
    correct: 0,
  },
  {
    start: 'إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ',
    completion: 'الْمُتَطَهِّرِينَ',
    surah: 'البقرة',
    choices: ['المتطهرين', 'المتقين', 'المحسنين', 'الصابرين'],
    correct: 0,
  },
  {
    start: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ',
    completion: 'الْقُلُوبُ',
    surah: 'الرعد',
    choices: ['القلوب', 'النفوس', 'الأرواح', 'الأفئدة'],
    correct: 0,
  },
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

function getLevel(total: number) {
  let current = levels[0];
  for (const l of levels) {
    if (total >= l.minPoints) current = l;
  }
  return current;
}

export default {
  data: new SlashCommandBuilder()
    .setName('أكمل-الآية')
    .setDescription('أكمل الآية القرآنية'),

  async execute(interaction: ChatInputCommandInteraction) {
    const q = questions[Math.floor(Math.random() * questions.length)];

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < 4; i += 2) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      for (let j = i; j < i + 2 && j < 4; j++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`ayah_${j}`)
            .setLabel(`${String.fromCharCode(0x0660 + j + 1)}) ${q.choices[j]}`)
            .setStyle(ButtonStyle.Primary),
        );
      }
      rows.push(row);
    }

    const embed = buildEmbed('games', {
      title: '📖 أكمل الآية',
      description: `**﴿${q.start}﴾**\n\nمن سورة **${q.surah}**`,
      footer: 'اختر الإكمال الصحيح',
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

      const chosen = parseInt(collected.customId.replace('ayah_', ''));
      const isCorrect = chosen === q.correct;

      await ensureUser(interaction.user.id, interaction.user.username);

      const points = isCorrect ? 10 : -2;

      await prisma.gameScore.create({
        data: {
          userId: interaction.user.id,
          gameType: 'complete-ayah',
          score: isCorrect ? 10 : 0,
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

      const fullAyah = `**﴿${q.start} ${q.completion}﴾**`;

      const resultEmbed = buildEmbed('games', {
        title: isCorrect ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة',
        description: isCorrect
          ? `${fullAyah}\n\nأحسنت! +${points} نقطة`
          : `${fullAyah}\n\nالإجابة الصحيحة: **${q.choices[q.correct]}**`,
        fields: [
            { name: 'السورة', value: q.surah, inline: true },
            { name: 'النقاط', value: `${isCorrect ? '+' : ''}${points}`, inline: true },
            { name: 'المستوى', value: currentLevel.name, inline: true },
        ],
      });

      await collected.update({ embeds: [resultEmbed], components: [] });
    } catch {
      const timeoutEmbed = buildEmbed('games', {
        title: '⏰ انتهى الوقت',
        description: `**﴿${q.start} ${q.completion}﴾**\n\nمن سورة **${q.surah}**`,
      });
      await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
    }
  },
  category: 'games',
} as Command;
