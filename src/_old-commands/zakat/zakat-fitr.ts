import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';

const currentYear = new Date().getFullYear();

export default {
  data: new SlashCommandBuilder()
    .setName('زكاة-الفطر')
    .setDescription('معلومات عن زكاة الفطر'),

  async execute(interaction: ChatInputCommandInteraction) {
    const estimatedValue = `大約 ${(currentYear * 0.5 + 2).toFixed(2)} USD`;

    const embed = buildEmbed('zakat', {
      title: 'زكاة الفطر',
      fields: [
        {
          name: 'تعريفها',
          value: 'زكاة الفطر هي صدقة يجب إخراجها قبل صلاة عيد الفطر، طهرة للصائم من اللغو والرفث، وطعمة للمساكين.',
        },
        {
          name: 'مقدارها',
          value: 'صاع من طعام (حوالي 2.5 - 3 كجم) من قوت البلد: أرز، تمر، شعير، زبيب، أو أقط. وتُخرج نقداً بقيمته عند كثير من العلماء.',
        },
        {
          name: 'وقت إخراجها',
          value: 'وقت وجوبها: غروب شمس آخر يوم من رمضان. وقت جوازها: قبل العيد بيوم أو يومين. وقت استحبابها: صباح العيد قبل الصلاة. وقت كراهتها: بعد صلاة العيد.',
        },
        {
          name: 'المستحقون',
          value: 'الفقير والمسكين، وهي تقدم على سائر الصدقات لأنها فرض. قال النبي ﷺ: "أغنوهم عن الطلب في هذا اليوم".',
        },
        {
          name: `القيمة التقريبية (${currentYear})`,
          value: `${estimatedValue} للفرد الواحد. يفضل مراجعة الجهات المختصة في بلدك لمعرفة القيمة المحددة.`,
        },
        {
          name: 'الدليل',
          value: 'عن ابن عمر رضي الله عنهما قال: "فرض رسول الله ﷺ زكاة الفطر صاعاً من تمر أو صاعاً من شعير على الذكر والأنثى والحر والمملوك من المسلمين" (متفق عليه).',
        },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'zakat',
} as Command;
