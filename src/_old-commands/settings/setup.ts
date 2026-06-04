import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

export default {
  data: new SlashCommandBuilder()
    .setName('إعداد')
    .setDescription('لوحة إعدادات السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
      return;
    }

    const settings = await prisma.guildSetting.findUnique({
      where: { guildId: interaction.guildId },
    });
    const guild = await prisma.guild.findUnique({
      where: { id: interaction.guildId },
    });
    const prayerSettings = await prisma.prayerSetting.findMany({
      where: { guildId: interaction.guildId },
    });

    const embed = buildEmbed('settings', {
      title: 'لوحة إعدادات السيرفر',
      fields: [
        {
          name: 'روم الأذكار',
          value: settings?.adhkarChannel ? `<#${settings.adhkarChannel}>` : 'غير مضبوط',
          inline: true,
        },
        {
          name: 'روم الإشعارات',
          value: settings?.announcementChan ? `<#${settings.announcementChan}>` : 'غير مضبوط',
          inline: true,
        },
        {
          name: 'روم الصلاة',
          value: prayerSettings.length > 0 ? prayerSettings.map(p => `<#${p.channel}>`).join('\n') : 'غير مضبوط',
          inline: true,
        },
        {
          name: 'اللغة',
          value: guild?.lang === 'en' ? 'English' : 'العربية',
          inline: true,
        },
        {
          name: 'وقت أذكار الصباح',
          value: settings?.adhkarMorning || '06:00',
          inline: true,
        },
        {
          name: 'وقت أذكار المساء',
          value: settings?.adhkarEvening || '18:00',
          inline: true,
        },
      ],
      footer: 'استخدم الأوامر أدناه لتعديل الإعدادات',
    });

    const guide = buildEmbed('settings', {
      title: 'الأوامر المتاحة',
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
  },
  category: 'settings',
} as Command;
