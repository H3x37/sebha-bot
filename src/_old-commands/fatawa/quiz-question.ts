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

interface QuizEntry {
  question: string;
  answer: string;
}

const quizDB: QuizEntry[] = [
  { question: 'كم عدد أركان الإسلام؟', answer: 'خمسة أركان: الشهادتان، الصلاة، الزكاة، الصوم، الحج.' },
  { question: 'كم عدد أركان الإيمان؟', answer: 'ستة: الإيمان بالله، وملائكته، وكتبه، ورسله، واليوم الآخر، والقدر خيره وشره.' },
  { question: 'ما هي السورة التي تسمى قلب القرآن؟', answer: 'سورة يس. قال النبي صلى الله عليه وسلم: "إن لكل شيء قلباً وقلب القرآن يس".' },
  { question: 'ما هي أول آية نزلت من القرآن؟', answer: 'أول آية نزلت: "اقرأ باسم ربك الذي خلق" (العلق: 1).' },
  { question: 'كم مرة ذكرت كلمة "الدنيا" في القرآن؟', answer: 'ذكرت كلمة "الدنيا" في القرآن 115 مرة.' },
  { question: 'ما هي السورة التي تعدل ثلث القرآن؟', answer: 'سورة الإخلاص. قال النبي صلى الله عليه وسلم: "قل هو الله أحد تعدل ثلث القرآن".' },
  { question: 'من هو الصحابي الذي لقب بـ "أسد الله"؟', answer: 'حمزة بن عبد المطلب رضي الله عنه، عم النبي صلى الله عليه وسلم.' },
  { question: 'كم عدد سجدات التلاوة في القرآن؟', answer: 'خمسة عشر سجدة في المصحف المعتمد.' },
  { question: 'ما هي السورة التي تسمى عروس القرآن؟', answer: 'سورة الرحمن. ورد ذلك عن بعض السلف.' },
  { question: 'من هو النبي الذي ابتلعه الحوت؟', answer: 'نبي الله يونس عليه السلام. قال تعالى: "فالتقمه الحوت وهو مليم".' },
  { question: 'ما هي أطول سورة في القرآن؟', answer: 'سورة البقرة، عدد آياتها 286 آية.' },
  { question: 'ما هي أقصر سورة في القرآن؟', answer: 'سورة الكوثر، عدد آياتها 3 آيات.' },
  { question: 'كم عدد الأنبياء المذكورين في القرآن؟', answer: 'خمسة وعشرون نبياً ورسولاً مذكورين بأسمائهم.' },
  { question: 'ما هي الغزوة التي نزل فيها قوله تعالى: "ويوم حنين إذ أعجبتكم كثرتكم"؟', answer: 'غزوة حنين.' },
  { question: 'من هو خاتم الأنبياء والمرسلين؟', answer: 'نبينا محمد صلى الله عليه وسلم، قال تعالى: "ولكن رسول الله وخاتم النبيين".' },
  { question: 'ما هي السورة التي كانت سبباً في إسلام عمر بن الخطاب؟', answer: 'سورة طه. أسلم رضي الله عنه بعد سماعها.' },
  { question: 'كم عدد أحزاب القرآن؟', answer: 'القرآن مقسم إلى 60 حزباً.' },
  { question: 'من هي المرأة التي ذكرت في القرآن باسمها؟', answer: 'مريم بنت عمران عليها السلام، وذكرت في سورة مريم.' },
  { question: 'ما هي أعظم آية في القرآن؟', answer: 'آية الكرسي (البقرة: 255). قال النبي صلى الله عليه وسلم: "أعظم آية في القرآن آية الكرسي".' },
  { question: 'كم عدد أجزاء القرآن؟', answer: 'القرآن مقسم إلى 30 جزءاً.' },
  { question: 'من هو أول مؤذن في الإسلام؟', answer: 'بلال بن رباح رضي الله عنه.' },
  { question: 'ما هي السورة التي تسمى "براءة"؟', answer: 'سورة التوبة، وهي السورة التي لم تبدأ بالبسملة.' },
  { question: 'ما هو أعظم ذنب في الإسلام؟', answer: 'الشرك بالله. قال تعالى: "إن الشرك لظلم عظيم".' },
  { question: 'كم سنة دام الوحي على النبي صلى الله عليه وسلم؟', answer: 'ثلاثة وعشرون عاماً.' },
  { question: 'من هو النبي الذي دعا ربه وقال: "ربي إني وهن العظم مني"؟', answer: 'نبي الله زكريا عليه السلام.' },
];

export default {
  data: new SlashCommandBuilder()
    .setName('سؤال-ديني')
    .setDescription('سؤال ديني عشوائي مع إمكانية إظهار الإجابة'),

  async execute(interaction: ChatInputCommandInteraction) {
    const entry = quizDB[Math.floor(Math.random() * quizDB.length)];

    const reveal = new ButtonBuilder()
      .setCustomId('reveal_answer')
      .setLabel('إظهار الإجابة')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(reveal);

    const embed = buildEmbed('fatawa', {
      title: 'سؤال ديني',
      description: `**السؤال:**\n${entry.question}\n\n**⟵ اضغط على الزر لإظهار الإجابة**`,
    });

    const reply = await interaction.reply({
      embeds: [embed],
      components: [row],
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    collector.on('collect', async (btnInteraction) => {
      if (btnInteraction.user.id !== interaction.user.id) {
        await btnInteraction.reply({ content: 'هذا الزر ليس لك.', flags: 64 });
        return;
      }

      const answerEmbed = buildEmbed('fatawa', {
        title: 'الإجابة',
        description: `**السؤال:** ${entry.question}\n\n**الإجابة:** ${entry.answer}`,
      });

      const disabledBtn = ButtonBuilder.from(reveal).setDisabled(true);
      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(disabledBtn);

      await btnInteraction.update({ embeds: [answerEmbed], components: [disabledRow] });
      collector.stop();
    });

    collector.on('end', async (_collected, reason) => {
      if (reason === 'time') {
        const expiredBtn = ButtonBuilder.from(reveal).setDisabled(true).setLabel('انتهى الوقت');
        const expiredRow = new ActionRowBuilder<ButtonBuilder>().addComponents(expiredBtn);
        await interaction.editReply({ components: [expiredRow] }).catch(() => {});
      }
    });
  },
  category: 'fatawa',
} as Command;
