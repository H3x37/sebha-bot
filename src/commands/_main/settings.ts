import {
  SlashCommandBuilder, ChatInputCommandInteraction,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType,
  PermissionFlagsBits, version as djsVersion
} from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { bold, blockquote } from '../../utils/format';
import prisma from '../../utils/prisma';
import { config } from '../../config';

const challengeContent: Record<string, { title: string; description: string }> = {
  حفظ: { title: 'تحدي الحفظ', description: 'احفظ آيات جديدة هذا الأسبوع! خصص ١٥ دقيقة يومياً للحفظ وكرر ما حفظته.\nقال رسول الله ﷺ: "خيركم من تعلم القرآن وعلمه".' },
  قراءة: { title: 'تحدي القراءة', description: 'اقرأ ورداً يومياً من القرآن! اجعل لك كل يوم ورداً ثابتاً ولو كان صفحة واحدة.\nقال الله تعالى: "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ".' },
  ذكر: { title: 'تحدي الذكر', description: 'أكثر من ذكر الله هذا الأسبوع! سبحان الله وبحمده، سبحان الله العظيم، لا إله إلا الله، الله أكبر.\nقال تعالى: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ".' },
  صلاة: { title: 'تحدي الصلاة', description: 'حافظ على الصلوات الخمس في أوقاتها هذا الأسبوع!\nقال رسول الله ﷺ: "الصلاة عماد الدين، من أقامها فقد أقام الدين".' },
};

const surahs = [
  { name: 'الفاتحة', verses: 7 },
  { name: 'يس', verses: 83 },
  { name: 'الملك', verses: 30 },
  { name: 'الواقعة', verses: 96 },
  { name: 'الكهف', verses: 110 },
  { name: 'الرحمن', verses: 78 },
  { name: 'الصافات', verses: 182 },
  { name: 'الإنسان', verses: 31 },
  { name: 'النبأ', verses: 40 },
  { name: 'الطارق', verses: 17 },
];

const adhkarBlocks = [
  {
    title: 'أذكار الصباح',
    content: 'سبحان الله وبحمده (١٠٠ مرة)\nلا إله إلا الله وحده لا شريك له (١٠ مرات)\nاللهم صل وسلم على نبينا محمد (١٠ مرات)\nأستغفر الله وأتوب إليه (١٠ مرات)\nاللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور',
  },
  {
    title: 'أذكار المساء',
    content: 'قراءة آية الكرسي\nالمعوذات (الإخلاص + الفلق + الناس) ٣ مرات\nحسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم (٧ مرات)\nاللهم أنت ربي لا إله إلا أنت خلقتني وأنا عبدك',
  },
  {
    title: 'أذكار النوم',
    content: 'آية الكرسي\nسبحان الله (٣٣ مرة)\nالحمد لله (٣٣ مرة)\nالله أكبر (٣٤ مرة)\nاللهم باسمك أموت وأحيا',
  },
  {
    title: 'أذكار الاستيقاظ',
    content: 'الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور\nلا إله إلا الله وحده لا شريك له له الملك وله الحمد وهو على كل شيء قدير',
  },
];

const prayers = [
  { name: 'صلاة الفجر', reward: 'كالذي قام الليل كله' },
  { name: 'صلاة الضحى', reward: 'تعدل ٣٦٠ صدقة' },
  { name: 'صلاة الظهر', reward: 'كفارة للذنوب' },
  { name: 'صلاة العصر', reward: 'كأنما صلى في المسجد الحرام' },
  { name: 'صلاة المغرب', reward: 'مثل حجة وعمرة' },
  { name: 'صلاة العشاء', reward: 'كقيام ليلة' },
  { name: 'قيام الليل', reward: 'أفضل الصلاة بعد الفريضة' },
];

interface BadgeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  query: (userId: string) => Promise<number>;
  target: number;
}

const allBadges: BadgeDef[] = [
  {
    id: 'الحافظ', name: 'الحافظ', desc: 'احفظ ١٠٠ آية قرآنية', icon: '📖',
    query: async (userId) => { const khatma = await prisma.khatmaProgress.findFirst({ where: { userId } }); return (khatma?.page || 0) * 15; },
    target: 100,
  },
  {
    id: 'المصلي', name: 'المصلي', desc: 'سجل ٥٠ صلاة', icon: '🕌',
    query: async (userId) => prisma.prayerLog.count({ where: { userId } }),
    target: 50,
  },
  {
    id: 'الذاكر', name: 'الذاكر', desc: 'أكثر من ٥٠٠ ذكر', icon: '🫶',
    query: async (userId) => { const pts = await prisma.userPoint.findUnique({ where: { userId } }); return pts?.total || 0; },
    target: 500,
  },
  {
    id: 'العالم', name: 'العالم', desc: 'احصل على ١٠٠ نقطة في المسابقات', icon: '📚',
    query: async (userId) => { const pts = await prisma.userPoint.findUnique({ where: { userId } }); return pts?.quizPts || 0; },
    target: 100,
  },
  {
    id: 'الصائم', name: 'الصائم', desc: 'تتبع صيامك', icon: '🌙',
    query: async () => 0,
    target: 1,
  },
];

function progressBar(current: number, max: number, length = 10) {
  const filled = Math.min(Math.round((current / max) * length), length);
  return '🟢'.repeat(filled) + '⚪'.repeat(length - filled);
}

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const typeLabels: Record<string, string> = {
  'أذكار-صباح': '🟢 أذكار الصباح',
  'أذكار-مساء': '🟣 أذكار المساء',
  'صلاة': '🕌 صلاة',
  'قرآن': '📖 قرآن',
  'ذكر-محدد': '🫶 ذكر محدد',
};

export default {
  data: new SlashCommandBuilder()
    .setName('إعدادات')
    .setDescription('أمر الإعدادات الموحد')
    .addSubcommand(sub =>
      sub.setName('عرض')
        .setDescription('لوحة إعدادات السيرفر'))
    .addSubcommand(sub =>
      sub.setName('لغة')
        .setDescription('تغيير لغة البوت')
        .addStringOption((option: any) =>
          option.setName('اللغة')
            .setDescription('اختر اللغة')
            .setRequired(true)
            .addChoices(
              { name: 'العربية', value: 'ar' },
              { name: 'English', value: 'en' },
            )))
    .addSubcommand(sub =>
      sub.setName('دور-ديني')
        .setDescription('تعيين رول ديني لعضو')
        .addStringOption((option: any) =>
          option.setName('الدور')
            .setDescription('اختر الدور الديني')
            .setRequired(true)
            .addChoices(
              { name: 'مصلي', value: 'مصلي' },
              { name: 'صائم', value: 'صائم' },
              { name: 'قارئ', value: 'قارئ' },
              { name: 'ذاكر', value: 'ذاكر' },
              { name: 'متصدق', value: 'متصدق' },
            ))
        .addRoleOption((option: any) =>
          option.setName('الرول')
            .setDescription('الرول الذي سيتم تعيينه')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('إعادة-ضبط')
        .setDescription('إعادة ضبط جميع إعدادات السيرفر'))
    .addSubcommand(sub =>
      sub.setName('تذكير-شخصي')
        .setDescription('ضبط تذكير شخصي')
        .addStringOption(option =>
          option.setName('النوع')
            .setDescription('نوع التذكير')
            .setRequired(true)
            .addChoices(
              { name: 'أذكار الصباح', value: 'أذكار-صباح' },
              { name: 'أذكار المساء', value: 'أذكار-مساء' },
              { name: 'صلاة', value: 'صلاة' },
              { name: 'قرآن', value: 'قرآن' },
              { name: 'ذكر محدد', value: 'ذكر-محدد' },
            ))
        .addStringOption(option =>
          option.setName('الوقت')
            .setDescription('الوقت بصيغة HH:MM (مثال: 06:00)')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('العنوان')
            .setDescription('عنوان إضافي للتذكير (اختياري)')
            .setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('تحدي-الأسبوع')
        .setDescription('عرض أو إنشاء تحدي الأسبوع')
        .addStringOption(option =>
          option.setName('النوع')
            .setDescription('اختر نوع التحدي (اتركه فارغاً لعرض التحدي الحالي)')
            .addChoices(
              { name: 'حفظ', value: 'حفظ' },
              { name: 'قراءة', value: 'قراءة' },
              { name: 'ذكر', value: 'ذكر' },
              { name: 'صلاة', value: 'صلاة' },
            )))
    .addSubcommand(sub =>
      sub.setName('ورد-اليوم')
        .setDescription('اقتراح ورد يومي كامل'))
    .addSubcommand(sub =>
      sub.setName('إنجازاتي')
        .setDescription('عرض شاراتك وإنجازاتك'))
    .addSubcommand(sub =>
      sub.setName('إحصائيات')
        .setDescription('عرض إحصائيات العبادة في السيرفر'))
    .addSubcommand(sub =>
      sub.setName('حالة-البوت')
        .setDescription('عرض حالة البوت'))
    .addSubcommand(sub =>
      sub.setName('بنق')
        .setDescription('اختبار البوت - ping')),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'عرض') {
      if (!interaction.guildId) {
        await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
        return;
      }

      const settings = await prisma.guildSetting.findUnique({ where: { guildId: interaction.guildId } });
      const guild = await prisma.guild.findUnique({ where: { id: interaction.guildId } });
      const prayerSettings = await prisma.prayerSetting.findMany({ where: { guildId: interaction.guildId } });

      const embed = buildEmbed('settings', {
        author: 'لوحة التحكم',
        title: '⚙️ إعدادات السيرفر',
        fields: [
          { name: bold('قناة الأذكار'), value: settings?.adhkarChannel ? `<#${settings.adhkarChannel}>` : 'غير مضبوطة', inline: true },
          { name: bold('وقت الصباح'), value: settings?.adhkarMorning || 'غير مضبوط', inline: true },
          { name: bold('وقت المساء'), value: settings?.adhkarEvening || 'غير مضبوط', inline: true },
          { name: bold('رول التنبيه'), value: settings?.adhkarRole ? `<@&${settings.adhkarRole}>` : 'غير مضبوط', inline: true },
          { name: bold('المستخدمون'), value: `${await prisma.user.count()}`, inline: true },
          { name: bold('الأذان'), value: prayerSettings.length > 0 ? prayerSettings.map(p => `<#${p.channel}>`).join(', ') : 'غير مضبوط', inline: true },
        ],
      });

      const guide = buildEmbed('settings', {
        author: 'دليل الأوامر',
        title: '📋 الأوامر المتاحة',
        description: [
          '`/ضبط-أذكار` - ضبط روم ووقت الأذكار',
          '`/إعداد-أذان` - ضبط روم ومدينة الأذان',
          '`/لغة` - تغيير لغة البوت',
          '`/دور-ديني` - تعيين رول ديني',
          '`/حالة-البوت` - عرض حالة البوت',
          '`/إعادة-ضبط` - إعادة ضبط جميع الإعدادات',
        ].join('\n'),
      });

      await interaction.reply({ embeds: [embed, guide], flags: 64 });
    } else if (sub === 'لغة') {
      if (!interaction.guildId) {
        await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
        return;
      }

      const lang = interaction.options.getString('اللغة', true);

      await prisma.guild.upsert({
        where: { id: interaction.guildId },
        update: { lang },
        create: { id: interaction.guildId, name: interaction.guild?.name || '', lang },
      });

      const msg = lang === 'en' ? 'Language has been set to **English**' : 'تم تعيين اللغة إلى **العربية**';

      const embed = buildEmbed('settings', { author: 'الإعدادات', title: '⚙️ تم تغيير اللغة', description: blockquote(msg) });
      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'دور-ديني') {
      if (!interaction.guildId) {
        await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
        return;
      }

      const roleName = interaction.options.getString('الدور', true);
      const role = interaction.options.getRole('الرول', true);

      const embed = buildEmbed('settings', {
        author: 'الأدوار الدينية',
        title: '✅ تم تعيين الدور',
        description: `تم تعيين رول **${role}** للدور **${roleName}**`,
        fields: [{ name: bold('ملاحظة'), value: 'هذا الإعداد غير مخزن في قاعدة البيانات حالياً. يمكن استخدام الرول في التنبيهات والإشعارات يدوياً.' }],
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'إعادة-ضبط') {
      if (!interaction.guildId) {
        await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
        return;
      }

      const embed = buildEmbed('settings', {
        title: 'تأكيد إعادة الضبط',
        description: 'هل أنت متأكد؟ سيتم حذف جميع إعدادات السيرفر بما في ذلك:\n• إعدادات الأذكار\n• إعدادات الأذان\n• جداول الأذكار',
      });

      const confirm = new ButtonBuilder().setCustomId('reset_confirm').setLabel('نعم، إعادة ضبط').setStyle(ButtonStyle.Danger);
      const cancel = new ButtonBuilder().setCustomId('reset_cancel').setLabel('إلغاء').setStyle(ButtonStyle.Secondary);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);

      const reply = await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
      const filter = (i: any) => i.user.id === interaction.user.id;
      const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 30000, max: 1 });

      collector.on('collect', async i => {
        if (i.customId === 'reset_cancel') {
          await i.update({ embeds: [buildEmbed('settings', { title: 'تم الإلغاء', description: 'لم يتم تغيير أي شيء.' })], components: [] });
          return;
        }

        await prisma.adhkarSchedule.deleteMany({ where: { guildId: interaction.guildId! } });
        await prisma.prayerSetting.deleteMany({ where: { guildId: interaction.guildId! } });
        await prisma.guildSetting.deleteMany({ where: { guildId: interaction.guildId! } });

        await i.update({ embeds: [buildEmbed('settings', { title: 'تمت إعادة الضبط', description: 'تم حذف جميع إعدادات السيرفر بنجاح.' })], components: [] });
      });

      collector.on('end', async collected => {
        if (collected.size === 0) {
          await interaction.editReply({ embeds: [buildEmbed('settings', { title: 'انتهى الوقت', description: 'لم يتم التأكيد في الوقت المحدد.' })], components: [] }).catch(() => {});
        }
      });
    } else if (sub === 'تذكير-شخصي') {
      const userId = interaction.user.id;
      const type = interaction.options.getString('النوع', true);
      const time = interaction.options.getString('الوقت', true);
      const title = interaction.options.getString('العنوان');

      if (!timeRegex.test(time)) {
        await interaction.reply({ embeds: [errorEmbed('صيغة الوقت غير صحيحة! استخدم صيغة HH:MM (مثال: 06:00)')], flags: 64 });
        return;
      }

      await prisma.user.upsert({
        where: { id: userId },
        update: { username: interaction.user.username },
        create: { id: userId, username: interaction.user.username },
      });

      const reminder = await prisma.reminder.create({
        data: { userId, type, title: title || typeLabels[type] || type, time },
      });

      const embed = buildEmbed('community', {
        author: 'التذكيرات',
        title: '⏰ تم ضبط التذكير',
        fields: [
          { name: bold('النوع'), value: typeLabels[type] || type, inline: true },
          { name: bold('الوقت'), value: time, inline: true },
          { name: bold('العنوان'), value: reminder.title, inline: false },
          { name: bold('المعرف'), value: `\`${reminder.id}\``, inline: false },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'تحدي-الأسبوع') {
      if (!interaction.guildId) {
        await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات.')], flags: 64 });
        return;
      }

      const type = interaction.options.getString('النوع');
      const guildId = interaction.guildId;

      if (type) {
        const existing = await prisma.weeklyChallenge.findFirst({ where: { guildId, active: true } });
        if (existing) {
          await prisma.weeklyChallenge.update({ where: { id: existing.id }, data: { active: false } });
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
          author: 'التحديات الأسبوعية',
          title: '🏆 تحدي جديد',
          description: 'تم إنشاء تحدي جديد لهذا الأسبوع!',
          fields: [
            { name: bold('النوع'), value: type, inline: true },
            { name: bold('الموعد النهائي'), value: `<t:${Math.floor(challenge.endDate.getTime() / 1000)}:R>`, inline: true },
            { name: bold(content.title), value: content.description },
          ],
        });

        await interaction.reply({ embeds: [embed] });
        return;
      }

      const existing = await prisma.weeklyChallenge.findFirst({ where: { guildId, active: true } });

      if (!existing) {
        await interaction.reply({ embeds: [errorEmbed('لا يوجد تحدي نشط حالياً.\nاستخدم الأمر مع تحديد نوع التحدي لإنشاء واحد!')] });
        return;
      }

      const embed = buildEmbed('community', {
        author: 'التحديات الأسبوعية',
        title: '🏆 تحدي هذا الأسبوع',
        fields: [
          { name: bold('النوع'), value: existing.type, inline: true },
          { name: bold('متبقي'), value: `<t:${Math.floor(existing.endDate.getTime() / 1000)}:R>`, inline: true },
          { name: bold(existing.title), value: existing.description },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'ورد-اليوم') {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const surah = surahs[dayOfYear % surahs.length];
      const adhkar = adhkarBlocks[Math.floor(dayOfYear / 7) % adhkarBlocks.length];
      const prayer = prayers[Math.floor(dayOfYear / 3) % prayers.length];

      const embed = buildEmbed('community', {
        author: 'وِرد اليوم',
        title: '📖 بركة اليوم',
        description: blockquote('بسم الله الرحمن الرحيم\nاللهم اجعل هذا اليوم مباركاً ووفقنا فيه لطاعتك.\n﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ﴾'),
        fields: [
          { name: bold('القرآن الكريم'), value: `**سورة ${surah.name}** (${surah.verses} آية)\nاقرأها بتدبر وتفكر في معانيها.\n\nثم اقرأ ما تيسر من القرآن بخشوع.` },
          { name: bold('الأذكار'), value: `**${adhkar.title}**\n${adhkar.content}` },
          { name: bold('الصلوات'), value: `**${prayer.name}**\n${prayer.reward}\n\nحافظ على جميع الصلوات الخمس في أوقاتها.` },
          { name: bold('وصية اليوم'), value: 'أكثر من الاستغفار فإنه مفتاح الفرج.\nقال الله تعالى:\n﴿فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا﴾' },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'إنجازاتي') {
      const userId = interaction.user.id;

      const [earnedBadges, ...progressValues] = await Promise.all([
        prisma.userBadge.findMany({ where: { userId } }),
        ...allBadges.map(b => b.query(userId)),
      ]);

      const earnedIds = new Set(earnedBadges.map(b => b.badgeId));

      const badgeLines = allBadges.map((badge, i) => {
        const earned = earnedIds.has(badge.id);
        const progress = progressValues[i];
        const display = Math.min(progress, badge.target);
        const bar = earned ? '🟢'.repeat(10) + ' ✅' : `${progressBar(display, badge.target)}\n${display}/${badge.target}`;
        return `**${badge.icon} ${badge.name}**\n${badge.desc}\n${bar}`;
      });

      const earnedList = earnedBadges.map(b => {
        const def = allBadges.find(a => a.id === b.badgeId);
        return `${def?.icon || '🏅'} ${b.badgeName}`;
      });

      const embed = buildEmbed('community', {
        author: interaction.user.username,
        title: '🏅 إنجازاتي',
        description: earnedBadges.length > 0
          ? `أهلاً **${interaction.user.username}**! 🎉\nلديك **${earnedBadges.length}** شارة:\n${earnedList.join(' - ')}`
          : `أهلاً **${interaction.user.username}**! ابدأ رحلتك لتحقيق الشارات 🎯`,
        fields: badgeLines.map((value) => ({ name: '\u200B', value, inline: false })),
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'إحصائيات') {
      if (!interaction.guildId) {
        await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات.')], flags: 64 });
        return;
      }

      const guildId = interaction.guildId;
      const gameTypeNames: Record<string, string> = {
        'quran-quiz': 'مسابقة قرآن', 'who-am-i': 'من أنا', 'complete-ayah': 'أكمل الآية', 'islamic-test': 'اختبار ديني',
      };

      const [totalPrayers, totalGames, activeParticipants, activeChallenges, gameGroups] = await Promise.all([
        prisma.prayerLog.count(),
        prisma.gameScore.count(),
        prisma.khatmaParticipant.count({ where: { guildId } }),
        prisma.weeklyChallenge.count({ where: { guildId, active: true } }),
        prisma.gameScore.groupBy({ by: ['gameType'], _count: true, orderBy: { _count: { gameType: 'desc' } } }),
      ]);

      const topGame = gameGroups[0];

      const embed = buildEmbed('community', {
        author: interaction.guild?.name || '',
        title: '📊 إحصائيات السيرفر',
        description: 'إحصائيات عامة للعبادة والمسابقات',
        fields: [
          { name: bold('إجمالي الصلوات المسجلة'), value: `**${totalPrayers}** صلاة`, inline: true },
          { name: bold('إجمالي الألعاب'), value: `**${totalGames}** لعبة`, inline: true },
          { name: bold('مشاركون في الختمة'), value: `**${activeParticipants}** عضو`, inline: true },
          { name: bold('تحديات نشطة'), value: `**${activeChallenges}** تحدي`, inline: true },
          ...(topGame ? [{ name: bold('اللعبة الأكثر لعباً'), value: `${gameTypeNames[topGame.gameType] || topGame.gameType} (${topGame._count} مرة)`, inline: false }] : []),
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'حالة-البوت') {
      const client = interaction.client;
      const uptime = Math.floor(client.uptime / 1000);
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;

      const commandCount = client.application?.commands
        ? (await client.application.commands.fetch()).size
        : 0;

      const embed = buildEmbed('settings', {
        author: 'حالة البوت',
        title: `🤖 ${config.botName}`,
        fields: [
          { name: bold('النسخة'), value: config.version, inline: true },
          { name: bold('Discord.js'), value: djsVersion, inline: true },
          { name: bold('البنج'), value: `${client.ws.ping}ms`, inline: true },
          { name: bold('السيرفرات'), value: `${client.guilds.cache.size}`, inline: true },
          { name: bold('الأوامر'), value: `${commandCount}`, inline: true },
          { name: bold('مدة التشغيل'), value: `${days}ي ${hours}س ${minutes}د ${seconds}ث`, inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    } else if (sub === 'بنق') {
      const ping = interaction.client.ws.ping;
      const embed = buildEmbed('default', {
        title: 'بونق!',
        description: `🟢 البوت يعمل!\n⏱️ البنق: **${ping}ms**`,
      });
      await interaction.reply({ embeds: [embed] });
    }
  },
  category: 'settings',
} as Command;
