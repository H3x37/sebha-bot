import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

const challengeContent: Record<string, { title: string; description: string }> = {
  حفظ: {
    title: 'تحدي الحفظ',
    description: 'احفظ آيات جديدة هذا الأسبوع! خصص ١٥ دقيقة يومياً للحفظ وكرر ما حفظته.\nقال رسول الله ﷺ: "خيركم من تعلم القرآن وعلمه".',
  },
  قراءة: {
    title: 'تحدي القراءة',
    description: 'اقرأ ورداً يومياً من القرآن! اجعل لك كل يوم ورداً ثابتاً ولو كان صفحة واحدة.\nقال الله تعالى: "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ".',
  },
  ذكر: {
    title: 'تحدي الذكر',
    description: 'أكثر من ذكر الله هذا الأسبوع! سبحان الله وبحمده، سبحان الله العظيم، لا إله إلا الله، الله أكبر.\nقال تعالى: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ".',
  },
  صلاة: {
    title: 'تحدي الصلاة',
    description: 'حافظ على الصلوات الخمس في أوقاتها هذا الأسبوع!\nقال رسول الله ﷺ: "الصلاة عماد الدين، من أقامها فقد أقام الدين".',
  },
};

export default {
  data: new SlashCommandBuilder()
    .setName('تحدي-الأسبوع')
    .setDescription('عرض أو إنشاء تحدي الأسبوع')
    .addStringOption(option =>
      option.setName('النوع')
        .setDescription('اختر نوع التحدي (اتركه فارغاً لعرض التحدي الحالي)')
        .addChoices(
          { name: 'حفظ', value: 'حفظ' },
          { name: 'قراءة', value: 'قراءة' },
          { name: 'ذكر', value: 'ذكر' },
          { name: 'صلاة', value: 'صلاة' },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات.')], flags: 64 });
      return;
    }

    const type = interaction.options.getString('النوع');
    const guildId = interaction.guildId;

    if (type) {
      const existing = await prisma.weeklyChallenge.findFirst({
        where: { guildId, active: true },
      });
      if (existing) {
        await prisma.weeklyChallenge.update({
          where: { id: existing.id },
          data: { active: false },
        });
      }

      const content = challengeContent[type];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      await prisma.guild.upsert({
        where: { id: guildId },
        update: { name: interaction.guild?.name || '' },
        create: { id: guildId, name: interaction.guild?.name || '' },
      });

      const challenge = await prisma.weeklyChallenge.create({
        data: { guildId, type, title: content.title, description: content.description, endDate },
      });

      const embed = buildEmbed('community', {
        title: 'تحدي جديد',
        description: 'تم إنشاء تحدي جديد لهذا الأسبوع!',
        fields: [
          { name: 'النوع', value: type, inline: true },
          { name: 'الموعد النهائي', value: `<t:${Math.floor(challenge.endDate.getTime() / 1000)}:R>`, inline: true },
          { name: content.title, value: content.description },
        ],
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    const existing = await prisma.weeklyChallenge.findFirst({
      where: { guildId, active: true },
    });

    if (!existing) {
      await interaction.reply({
        embeds: [errorEmbed('لا يوجد تحدي نشط حالياً.\nاستخدم الأمر مع تحديد نوع التحدي لإنشاء واحد!')],
      });
      return;
    }

    const embed = buildEmbed('community', {
      title: 'تحدي هذا الأسبوع',
      fields: [
        { name: 'النوع', value: existing.type, inline: true },
        { name: 'متبقي', value: `<t:${Math.floor(existing.endDate.getTime() / 1000)}:R>`, inline: true },
        { name: existing.title, value: existing.description },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'community',
} as Command;
