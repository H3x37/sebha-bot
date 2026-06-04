import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';

export default {
  data: new SlashCommandBuilder()
    .setName('مسبحة')
    .setDescription('مسبحة رقمية تفاعلية - سبح الله'),

  async execute(interaction: ChatInputCommandInteraction) {
    let count = 0;
    const totalGoal = 33;
    const tasbih = ['سُبْحَانَ اللَّهِ', 'الْحَمْدُ لِلَّهِ', 'اللَّهُ أَكْبَرُ'];

    const embed = buildEmbed('adhkar', {
      title: 'المسبحة الرقمية',
      description: `**سُبْحَانَ اللَّهِ**\n\nالعدد: **${count}** / ${totalGoal}`,
      fields: [
        { name: 'التسبيحة الحالية', value: 'سُبْحَانَ اللَّهِ', inline: true },
        { name: 'التقدم', value: '0%', inline: true },
      ],
    });

    const increment = new ButtonBuilder()
      .setCustomId('msbaha_add')
      .setLabel('➕')
      .setStyle(ButtonStyle.Success);

    const reset = new ButtonBuilder()
      .setCustomId('msbaha_reset')
      .setLabel('🔄')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(increment, reset);

    const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 300000 });

    let currentTasbih = 0;

    collector.on('collect', async i => {
      if (i.customId === 'msbaha_reset') {
        count = 0;
        currentTasbih = 0;
      } else {
        count++;
        if (count > totalGoal) {
          currentTasbih = (currentTasbih + 1) % tasbih.length;
          count = 1;
        }
      }

      const progress = Math.round((count / totalGoal) * 100);
      const newEmbed = buildEmbed('adhkar', {
        title: 'المسبحة الرقمية',
        description: `**${tasbih[currentTasbih]}**\n\nالعدد: **${count}** / ${totalGoal}`,
        fields: [
          { name: 'التسبيحة الحالية', value: tasbih[currentTasbih], inline: true },
          { name: 'التقدم', value: `${progress}%`, inline: true },
        ],
      });

      await i.update({ embeds: [newEmbed] });
    });

    collector.on('end', async () => {
      const disabledRow = ActionRowBuilder.from<ButtonBuilder>(row);
      disabledRow.components.forEach(c => c.setDisabled(true));
      await interaction.editReply({ components: [disabledRow] }).catch(() => {});
    });
  },
  category: 'adhkar',
} as Command;
