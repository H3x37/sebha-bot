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

const surahNames = [
  'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف',
  'الأنفال', 'التوبة', 'يونس', 'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر',
  'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه', 'الأنبياء', 'الحج', 'المؤمنون',
  'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم',
  'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر',
  'غافر', 'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد',
  'الفتح', 'الحجرات', 'ق', 'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن',
  'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة', 'الصف', 'الجمعة',
  'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة',
  'المعارج', 'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان',
  'المرسلات', 'النبأ', 'النازعات', 'عبس', 'التكوير', 'الانفطار', 'المطففين',
  'الانشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد',
  'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة',
  'الزلزلة', 'العاديات', 'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل',
  'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر', 'المسد', 'الإخلاص',
  'الفلق', 'الناس',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

const POINTS_PER_ROUND = 10;

export default {
  data: new SlashCommandBuilder()
    .setName('ترتيب-السور')
    .setDescription('رتب السور القرآنية حسب ترتيبها في المصحف'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    await ensureUser(interaction.user.id, interaction.user.username);

    let round = 0;
    let score = 0;
    let correctCount = 0;
    const totalRounds = 8;

    async function showRound() {
      if (round >= totalRounds) {
        const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
        const newTotal = (userPoint?.total || 0) + score;
        const newGamePts = (userPoint?.gamePts || 0) + score;
        await prisma.userPoint.update({
          where: { userId: interaction.user.id },
          data: { total: newTotal, gamePts: newGamePts },
        });

        const finalEmbed = buildEmbed('games', {
          title: 'ترتيب السور',
          description: `النتيجة النهائية: **${score}** من **${totalRounds * POINTS_PER_ROUND}**`,
          fields: [
            { name: 'الإجابات الصحيحة', value: `${correctCount} / ${totalRounds}`, inline: true },
            { name: 'النقاط', value: `${score}`, inline: true },
          ],
        });
        await interaction.editReply({ embeds: [finalEmbed], components: [] });
        return;
      }

      const indices = shuffle(Array.from({ length: 114 }, (_, i) => i)).slice(0, 4);
      const correctIdx = Math.floor(Math.random() * indices.length);
      const correctIndex = indices[correctIdx];
      const labels = indices.map(i => surahNames[i]);

      const embed = buildEmbed('games', {
        title: `ترتيب السور • السؤال ${round + 1}/${totalRounds}`,
        description: `أي من هذه السور يأتي **أولاً** في ترتيب المصحف؟\n\n${labels.map((n, i) => `**${i + 1}.** ${n}`).join('\n')}`,
        fields: [
          { name: 'النقاط', value: `${score}`, inline: true },
        ],
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        labels.map((_, i) =>
          new ButtonBuilder()
            .setCustomId(`order_${i}`)
            .setLabel(`${i + 1}`)
            .setStyle(ButtonStyle.Primary)
        )
      );

      await interaction.editReply({ embeds: [embed], components: [row] });

      const filter = (i: any) => i.user.id === interaction.user.id;
      const collected = await interaction.channel?.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 20000 }).catch(() => null);

      if (!collected) {
        const timeoutEmbed = buildEmbed('games', {
          title: 'انتهى الوقت',
          description: `السورة الصحيحة: **${surahNames[correctIndex]}** (رقم ${correctIndex + 1})`,
        });
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        round++;
        setTimeout(showRound, 2000);
        return;
      }

      const chosen = parseInt(collected.customId.replace('order_', ''));
      if (chosen === correctIdx) {
        score += POINTS_PER_ROUND;
        correctCount++;
        const correctEmbed = buildEmbed('games', {
          title: 'إجابة صحيحة',
          description: `✅ السورة **${surahNames[correctIndex]}** هي رقم ${correctIndex + 1} في المصحف.`,
        });
        await collected.update({ embeds: [correctEmbed], components: [] });
      } else {
        const wrongEmbed = buildEmbed('games', {
          title: 'إجابة خاطئة',
          description: `السورة الصحيحة: **${surahNames[correctIndex]}** (رقم ${correctIndex + 1})`,
        });
        await collected.update({ embeds: [wrongEmbed], components: [] });
      }

      round++;
      setTimeout(showRound, 2000);
    }

    showRound();
  },
  category: 'games',
} as Command;
