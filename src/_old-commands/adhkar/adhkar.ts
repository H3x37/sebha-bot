import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { adhkar, morningAdhkar, eveningAdhkar, sleepAdhkar, prayerAdhkar, eatingAdhkar, travelAdhkar, homeAdhkar, weddingAdhkar, duaToday, seasonalAdhkar } from '../../data/adhkar';

export default {
  data: new SlashCommandBuilder()
    .setName('ذكر')
    .setDescription('اذكر الله يذكرك')
    .addStringOption(option =>
      option.setName('النوع')
        .setDescription('اختر نوع الذكر')
        .setRequired(true)
        .addChoices(
          { name: 'أذكار عامة', value: 'general' },
          { name: 'أذكار الصباح', value: 'morning' },
          { name: 'أذكار المساء', value: 'evening' },
          { name: 'أذكار النوم', value: 'sleep' },
          { name: 'أذكار الصلاة', value: 'prayer' },
          { name: 'دعاء اليوم', value: 'dua' },
          { name: 'أذكار الأكل', value: 'eating' },
          { name: 'أذكار السفر', value: 'travel' },
          { name: 'أذكار المنزل', value: 'home' },
          { name: 'أذكار الزواج', value: 'wedding' },
          { name: '🌙 أذكار رمضان', value: 'ramadan' },
          { name: '🕋 أذكار الحج', value: 'hajj' },
          { name: '📅 أذكار الجمعة', value: 'friday' },
          { name: '🎊 أذكار العيد', value: 'eid' },
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString('النوع', true);
    let data: typeof adhkar;
    let title: string;

    let randomItem: typeof adhkar[0];

    switch (type) {
      case 'general': data = adhkar; title = 'أذكار عامة'; break;
      case 'morning': data = morningAdhkar; title = 'أذكار الصباح'; break;
      case 'evening': data = eveningAdhkar; title = 'أذكار المساء'; break;
      case 'sleep': data = sleepAdhkar; title = 'أذكار النوم'; break;
      case 'prayer': data = prayerAdhkar; title = 'أذكار الصلاة'; break;
      case 'dua': data = duaToday; title = 'دعاء اليوم'; break;
      case 'eating': data = eatingAdhkar; title = 'أذكار الأكل والشرب'; break;
      case 'travel': data = travelAdhkar; title = 'أذكار السفر'; break;
      case 'home': data = homeAdhkar; title = 'أذكار المنزل'; break;
      case 'wedding': data = weddingAdhkar; title = 'أذكار الزواج والأسرة'; break;
      case 'ramadan': data = seasonalAdhkar.ramadan; title = 'أذكار رمضان'; break;
      case 'hajj': data = seasonalAdhkar.hajj; title = 'أذكار الحج'; break;
      case 'friday': data = seasonalAdhkar.friday; title = 'أذكار الجمعة'; break;
      case 'eid': data = seasonalAdhkar.eid; title = 'أذكار العيد'; break;
      default: data = adhkar; title = 'أذكار عامة';
    }

    randomItem = data[Math.floor(Math.random() * data.length)];

    const embed = buildEmbed('adhkar', {
      title,
      description: `**${randomItem.text}**`,
      fields: [
        { name: 'التكرار', value: randomItem.count, inline: true },
        { name: 'الفضل', value: randomItem.blessing, inline: true },
      ],
    });

    const previous = new ButtonBuilder()
      .setCustomId('dhikr_prev')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary);

    const random = new ButtonBuilder()
      .setCustomId('dhikr_random')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Primary);

    const next = new ButtonBuilder()
      .setCustomId('dhikr_next')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(previous, random, next);

    const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 120000 });

    let currentIndex = Math.floor(Math.random() * data.length);

    collector.on('collect', async i => {
      if (i.customId === 'dhikr_prev') {
        currentIndex = (currentIndex - 1 + data.length) % data.length;
      } else if (i.customId === 'dhikr_next') {
        currentIndex = (currentIndex + 1) % data.length;
      } else {
        currentIndex = Math.floor(Math.random() * data.length);
      }

      const item = data[currentIndex];
      const newEmbed = buildEmbed('adhkar', {
        title,
        description: `**${item.text}**`,
        fields: [
          { name: 'التكرار', value: item.count, inline: true },
          { name: 'الفضل', value: item.blessing, inline: true },
          { name: 'العدد', value: `${currentIndex + 1} / ${data.length}`, inline: true },
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
