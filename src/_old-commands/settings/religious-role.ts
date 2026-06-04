import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';

export default {
  data: new SlashCommandBuilder()
    .setName('دور-ديني')
    .setDescription('تعيين رول ديني لعضو')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
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
    .addRoleOption(option =>
      option.setName('الرول')
        .setDescription('الرول الذي سيتم تعيينه')
        .setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
      return;
    }

    const roleName = interaction.options.getString('الدور', true);
    const role = interaction.options.getRole('الرول', true);

    const embed = buildEmbed('settings', {
      title: 'تم تعيين الدور الديني',
      description: `تم تعيين رول **${role}** للدور **${roleName}**`,
      fields: [
        { name: 'ملاحظة', value: 'هذا الإعداد غير مخزن في قاعدة البيانات حالياً. يمكن استخدام الرول في التنبيهات والإشعارات يدوياً.' },
      ],
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'settings',
} as Command;
