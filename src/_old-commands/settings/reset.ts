import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';

export default {
  data: new SlashCommandBuilder()
    .setName('إعادة-ضبط')
    .setDescription('إعادة ضبط جميع إعدادات السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
      return;
    }

    const embed = buildEmbed('settings', {
      title: 'تأكيد إعادة الضبط',
      description: 'هل أنت متأكد؟ سيتم حذف جميع إعدادات السيرفر بما في ذلك:\n• إعدادات الأذكار\n• إعدادات الأذان\n• جداول الأذكار',
    });

    const confirm = new ButtonBuilder()
      .setCustomId('reset_confirm')
      .setLabel('نعم، إعادة ضبط')
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId('reset_cancel')
      .setLabel('إلغاء')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);

    const reply = await interaction.reply({ embeds: [embed], components: [row], flags: 64 });

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 30000, max: 1 });

    collector.on('collect', async i => {
      if (i.customId === 'reset_cancel') {
        const cancelled = buildEmbed('settings', {
          title: 'تم الإلغاء',
          description: 'لم يتم تغيير أي شيء.',
        });
        await i.update({ embeds: [cancelled], components: [] });
        return;
      }

      await prisma.adhkarSchedule.deleteMany({ where: { guildId: interaction.guildId! } });
      await prisma.prayerSetting.deleteMany({ where: { guildId: interaction.guildId! } });
      await prisma.guildSetting.deleteMany({ where: { guildId: interaction.guildId! } });

      const done = buildEmbed('settings', {
        title: 'تمت إعادة الضبط',
        description: 'تم حذف جميع إعدادات السيرفر بنجاح.',
      });
      await i.update({ embeds: [done], components: [] });
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        const expired = buildEmbed('settings', {
          title: 'انتهى الوقت',
          description: 'لم يتم التأكيد في الوقت المحدد.',
        });
        await interaction.editReply({ embeds: [expired], components: [] }).catch(() => {});
      }
    });
  },
  category: 'settings',
} as Command;
