import {
  SlashCommandBuilder, ChatInputCommandInteraction,
  PermissionFlagsBits, ChannelType
} from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { bold, blockquote, medal } from '../../utils/format';
import prisma from '../../utils/prisma';
import { levels } from '../../config';
import { fetchPrayerTimes, adhanApi } from '../../utils/api';

const prayerNames: Record<string, string> = {
  Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
};

export default {
  data: new SlashCommandBuilder()
    .setName('صلاة')
    .setDescription('أمر الصلاة الموحد')
    .addSubcommand(sub =>
      sub.setName('أوقات')
        .setDescription('عرض أوقات الصلاة لمدينة محددة')
        .addStringOption(option =>
          option.setName('city')
            .setDescription('اسم المدينة')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('قبلة')
        .setDescription('معرفة اتجاه القبلة لمدينة محددة')
        .addStringOption(option =>
          option.setName('city')
            .setDescription('اسم المدينة')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('country')
            .setDescription('اسم الدولة')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('سجل')
        .setDescription('تسجيل صلاة مفروضة')
        .addStringOption(option =>
          option.setName('prayer')
            .setDescription('اختر الصلاة')
            .setRequired(true)
            .addChoices(
              { name: 'الفجر', value: 'الفجر' },
              { name: 'الظهر', value: 'الظهر' },
              { name: 'العصر', value: 'العصر' },
              { name: 'المغرب', value: 'المغرب' },
              { name: 'العشاء', value: 'العشاء' },
            )))
    .addSubcommand(sub =>
      sub.setName('نقاطي')
        .setDescription('عرض نقاط الصلاة الخاصة بك'))
    .addSubcommand(sub =>
      sub.setName('لوحة')
        .setDescription('لوحة شرف المصلين في السيرفر'))
    .addSubcommand(sub =>
      sub.setName('إعداد-أذان')
        .setDescription('إعداد قناة الأذان لمدينة محددة')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('القناة المخصصة للأذان')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true))
        .addStringOption(option =>
          option.setName('city')
            .setDescription('اسم المدينة')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('country')
            .setDescription('اسم الدولة')
            .setRequired(true))),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'أوقات') {
      const city = interaction.options.getString('city', true);

      await interaction.deferReply();

      try {
        const data = await fetchPrayerTimes(city, city);
        const timings = data.timings;
        const hijri = data.date.hijri;

        const hijriMonthName = hijri.month.ar || hijri.month.en;

        const fields = Object.entries(prayerNames).map(([key, name]) => ({
          name: name,
          value: bold(timings[key]),
          inline: true,
        }));

        const embed = buildEmbed('prayer', {
          author: 'مواقيت الصلاة',
          title: `🕌 أوقات الصلاة • ${city}`,
          fields,
          footer: `${hijri.day} ${hijriMonthName} ${hijri.year}هـ • ${data.date.readable}`,
        });

        await interaction.editReply({ embeds: [embed] });
      } catch {
        await interaction.editReply({ embeds: [errorEmbed('تعذر جلب أوقات الصلاة. تأكد من صحة اسم المدينة.')] });
      }
    } else if (sub === 'قبلة') {
      const city = interaction.options.getString('city', true);
      const country = interaction.options.getString('country', true);

      await interaction.deferReply();

      try {
        const prayerData = await fetchPrayerTimes(city, country);
        const { latitude, longitude } = prayerData.meta;

        const { data } = await adhanApi.get(`/qibla/${latitude}/${longitude}`);
        const direction = data.data.direction;

        const directions = [
          'شمال', 'شمال شرقي', 'شرق', 'جنوب شرقي',
          'جنوب', 'جنوب غربي', 'غرب', 'شمال غربي',
        ];
        const index = Math.round(direction / 45) % 8;
        const compassDir = directions[index];

        const embed = buildEmbed('prayer', {
          author: 'اتجاه القبلة',
          title: `🕌 القبلة • ${city}`,
          description: blockquote(`اتجاه القبلة من ${city}: ${bold(`${direction.toFixed(2)}°`)} (${compassDir})`),
          fields: [
            { name: bold('الإحداثيات'), value: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`, inline: true },
            { name: bold('الاتجاه'), value: `${direction.toFixed(2)}°`, inline: true },
            { name: bold('التقريبي'), value: compassDir, inline: true },
          ],
        });

        await interaction.editReply({ embeds: [embed] });
      } catch {
        await interaction.editReply({ embeds: [errorEmbed('تعذر جلب اتجاه القبلة. تأكد من صحة اسم المدينة والدولة.')] });
      }
    } else if (sub === 'سجل') {
      const prayer = interaction.options.getString('prayer', true);
      const userId = interaction.user.id;
      const username = interaction.user.username;

      await interaction.deferReply();

      try {
        await prisma.user.upsert({
          where: { id: userId },
          update: { username },
          create: { id: userId, username },
        });

        const lastLog = await prisma.prayerLog.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let currentStreak = 1;

        if (lastLog) {
          const logDate = new Date(lastLog.createdAt);
          logDate.setHours(0, 0, 0, 0);

          if (logDate.getTime() === today.getTime()) {
            const existing = await prisma.userPoint.findUnique({ where: { userId } });
            currentStreak = existing?.streak || 1;
          } else if (logDate.getTime() === yesterday.getTime()) {
            const existing = await prisma.userPoint.findUnique({ where: { userId } });
            currentStreak = (existing?.streak || 0) + 1;
          }
        }

        await prisma.prayerLog.create({
          data: { userId, prayer },
        });

        const POINTS = 10;

        const userPoint = await prisma.userPoint.upsert({
          where: { userId },
          update: {
            prayerPts: { increment: POINTS },
            total: { increment: POINTS },
            streak: currentStreak,
          },
          create: {
            userId,
            prayerPts: POINTS,
            total: POINTS,
            streak: currentStreak,
          },
        });

        const totalPoints = userPoint.total;
        let newLevel = userPoint.level;
        for (let i = levels.length - 1; i >= 0; i--) {
          if (totalPoints >= levels[i].minPoints) {
            newLevel = levels[i].name;
            break;
          }
        }

        if (newLevel !== userPoint.level) {
          await prisma.userPoint.update({
            where: { userId },
            data: { level: newLevel },
          });
        }

        const todayPrayers = await prisma.prayerLog.findMany({
          where: {
            userId,
            createdAt: { gte: today },
          },
          select: { prayer: true },
        });

        const prayedNames = [...new Set(todayPrayers.map(p => p.prayer))];
        const allPrayers = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
        const remaining = allPrayers.filter(p => !prayedNames.includes(p));

        const embed = buildEmbed('prayer', {
          author: 'تسجيل الصلاة',
          title: `🕌 صلاة ${prayer}`,
          description: blockquote(`أحسنت! +${POINTS} نقطة`),
          fields: [
            { name: bold('النقاط'), value: `${userPoint.prayerPts}`, inline: true },
            { name: bold('السلسلة'), value: `${currentStreak} أيام`, inline: true },
            { name: bold('المستوى'), value: newLevel, inline: true },
            { name: bold('صلوات اليوم'), value: prayedNames.length > 0 ? prayedNames.join('، ') : '—', inline: false },
            { name: bold('المتبقي'), value: remaining.length > 0 ? remaining.join('، ') : 'جميع الصلوات ✓', inline: false },
          ],
        });

        await interaction.editReply({ embeds: [embed] });
      } catch {
        await interaction.editReply({ embeds: [errorEmbed('حدث خطأ أثناء تسجيل الصلاة.')] });
      }
    } else if (sub === 'نقاطي') {
      const userId = interaction.user.id;

      await interaction.deferReply();

      try {
        const userPoint = await prisma.userPoint.findUnique({
          where: { userId },
        });

        const totalPrayers = await prisma.prayerLog.count({
          where: { userId },
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayPrayers = await prisma.prayerLog.findMany({
          where: {
            userId,
            createdAt: { gte: today },
          },
          select: { prayer: true },
        });

        const todayNames = [...new Set(todayPrayers.map(p => p.prayer))];

        if (!userPoint) {
          const embed = buildEmbed('prayer', {
            author: 'نقاط الصلاة',
            title: '🕌 سجل صلاتك',
            description: blockquote('لم تسجل أي صلاة بعد.\nاستخدم الأمر `/صلاة سجل` لبدء التسجيل!'),
          });
          await interaction.editReply({ embeds: [embed] });
          return;
        }

        const embed = buildEmbed('prayer', {
          author: 'نقاط الصلاة',
          title: `🕌 ${interaction.user.displayName}`,
          fields: [
            { name: bold('نقاط الصلاة'), value: `${userPoint.prayerPts}`, inline: true },
            { name: bold('السلسلة'), value: `${userPoint.streak} يوم`, inline: true },
            { name: bold('المستوى'), value: userPoint.level, inline: true },
            { name: bold('الصلوات المسجلة'), value: `${totalPrayers}`, inline: true },
            { name: bold('إجمالي النقاط'), value: `${userPoint.total}`, inline: true },
            { name: bold('صلوات اليوم'), value: todayNames.length > 0 ? todayNames.join('، ') : 'لا يوجد', inline: true },
          ],
        });

        await interaction.editReply({ embeds: [embed] });
      } catch {
        await interaction.editReply({ embeds: [errorEmbed('حدث خطأ أثناء جلب نقاط الصلاة.')] });
      }
    } else if (sub === 'لوحة') {
      if (!interaction.guild) {
        await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
        return;
      }

      await interaction.deferReply();

      try {
        const members = await interaction.guild.members.fetch();
        const memberIds = [...members.keys()];

        const topUsers = await prisma.userPoint.findMany({
          where: { userId: { in: memberIds } },
          orderBy: { prayerPts: 'desc' },
          take: 10,
          include: { user: true },
        });

        if (topUsers.length === 0) {
          await interaction.editReply({ embeds: [errorEmbed('لا يوجد مصلين مسجلين في هذا السيرفر بعد.')] });
          return;
        }

        const lines = topUsers.map((u, i) => {
          const member = members.get(u.userId);
          const name = member?.displayName || u.user.username;
          return `${medal(i)} ${bold(name)}  —  ${u.prayerPts} نقطة  •  ${u.streak} يوم`;
        });

        const embed = buildEmbed('prayer', {
          author: 'لوحة الشرف',
          title: '🕌 المتصدرون',
          description: blockquote(lines.join('\n')),
        });

        await interaction.editReply({ embeds: [embed] });
      } catch {
        await interaction.editReply({ embeds: [errorEmbed('حدث خطأ أثناء جلب اللوحة.')] });
      }
    } else if (sub === 'إعداد-أذان') {
      if (!interaction.guildId) {
        await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
        return;
      }

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ embeds: [errorEmbed('يتطلب هذا الأمر صلاحية المسؤول (Administrator).')], flags: 64 });
        return;
      }

      const channel = interaction.options.getChannel('channel', true);
      const city = interaction.options.getString('city', true);
      const country = interaction.options.getString('country', true);

      await prisma.guild.upsert({
        where: { id: interaction.guildId },
        update: {},
        create: { id: interaction.guildId, name: interaction.guild?.name || '' },
      });

      await prisma.prayerSetting.upsert({
        where: { guildId_channel: { guildId: interaction.guildId, channel: channel.id } },
        update: { city, country },
        create: { guildId: interaction.guildId, channel: channel.id, city, country },
      });

      const embed = buildEmbed('prayer', {
        author: 'إعداد الأذان',
        title: '🕌 تم الإعداد',
        fields: [
          { name: bold('القناة'), value: `${channel}`, inline: true },
          { name: bold('المدينة'), value: city, inline: true },
          { name: bold('الدولة'), value: country, inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
    }
  },
  category: 'prayer',
} as Command;
