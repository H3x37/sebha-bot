import {
  SlashCommandBuilder, ChatInputCommandInteraction,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType,
  PermissionFlagsBits
} from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import prisma from '../../utils/prisma';
import { adhkar, morningAdhkar, eveningAdhkar, sleepAdhkar, prayerAdhkar, eatingAdhkar, travelAdhkar, homeAdhkar, weddingAdhkar, duaToday, seasonalAdhkar } from '../../data/adhkar';
import { arabicNumeral, bold, blockquote, sep } from '../../utils/format';

export default {
  data: new SlashCommandBuilder()
    .setName('أذكار')
    .setDescription('الأذكار والأدعية والمسبحة')
    .addSubcommandGroup(group =>
      group.setName('عرض')
        .setDescription('عرض الأذكار كاملة')
        .addSubcommand(sub =>
          sub.setName('صباح')
            .setDescription('أذكار الصباح كاملة'))
        .addSubcommand(sub =>
          sub.setName('مساء')
            .setDescription('أذكار المساء كاملة')))
    .addSubcommand(sub =>
      sub.setName('ذكر')
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
            )))
    .addSubcommand(sub =>
      sub.setName('دعاء-اليوم')
        .setDescription('دعاء مقترح لهذا اليوم'))
    .addSubcommand(sub =>
      sub.setName('مسبحة')
        .setDescription('مسبحة رقمية تفاعلية - سبح الله'))
    .addSubcommand(sub =>
      sub.setName('ضبط')
        .setDescription('ضبط إعدادات الأذكار في السيرفر')
        .addChannelOption((option: any) =>
          option.setName('الروم')
            .setDescription('الروم المخصص للأذكار')
            .setRequired(true))
        .addStringOption((option: any) =>
          option.setName('وقت-الصباح')
            .setDescription('وقت أذكار الصباح (HH:MM) - بصيغة 24 ساعة'))
        .addStringOption((option: any) =>
          option.setName('وقت-المساء')
            .setDescription('وقت أذكار المساء (HH:MM) - بصيغة 24 ساعة'))
        .addRoleOption((option: any) =>
          option.setName('رول-التنبيه')
            .setDescription('الرول الذي يتم منشنهم عند الأذكار'))),

  async execute(interaction: ChatInputCommandInteraction) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    if (sub === 'ضبط') {
      if (!interaction.guildId) {
        await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
        return;
      }

      const channel = interaction.options.getChannel('الروم', true);
      const morningTime = interaction.options.getString('وقت-الصباح') || '06:00';
      const eveningTime = interaction.options.getString('وقت-المساء') || '18:00';
      const role = interaction.options.getRole('رول-التنبيه');

      await prisma.guild.upsert({
        where: { id: interaction.guildId },
        update: {},
        create: { id: interaction.guildId, name: interaction.guild?.name || '' },
      });

      await prisma.guildSetting.upsert({
        where: { guildId: interaction.guildId },
        update: {
          adhkarChannel: channel.id,
          adhkarRole: role?.id || null,
          adhkarMorning: morningTime,
          adhkarEvening: eveningTime,
        },
        create: {
          guildId: interaction.guildId,
          adhkarChannel: channel.id,
          adhkarRole: role?.id || null,
          adhkarMorning: morningTime,
          adhkarEvening: eveningTime,
        },
      });

      const embed = buildEmbed('settings', {
        title: 'تم ضبط الأذكار',
        fields: [
          { name: 'الروم', value: `${channel}`, inline: true },
          { name: 'وقت الصباح', value: morningTime, inline: true },
          { name: 'وقت المساء', value: eveningTime, inline: true },
          { name: 'رول التنبيه', value: role ? `${role}` : 'بدون', inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (group === 'عرض') {
      if (sub === 'صباح') {
        const description = morningAdhkar.map((a, i) =>
          `${arabicNumeral(i + 1)}. ${bold(a.text)}\n${arabicNumeral(parseInt(a.count) || 0)} مرات ${sep()} ${a.blessing}`
        ).join('\n\n');

        const embed = buildEmbed('adhkar', {
          title: 'أذكار الصباح',
          description,
          footer: 'سِبْحَة • فاذكروا الله يذكركم',
        });

        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (sub === 'مساء') {
        const description = eveningAdhkar.map((a, i) =>
          `${arabicNumeral(i + 1)}. ${bold(a.text)}\n${arabicNumeral(parseInt(a.count) || 0)} مرات ${sep()} ${a.blessing}`
        ).join('\n\n');

        const embed = buildEmbed('adhkar', {
          title: 'أذكار المساء',
          description,
          footer: 'سِبْحَة • فاذكروا الله يذكركم',
        });

        await interaction.reply({ embeds: [embed] });
        return;
      }
    }

    if (sub === 'ذكر') {
      const type = interaction.options.getString('النوع', true);
      let data: typeof adhkar;
      let title: string;

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

      let currentIndex = Math.floor(Math.random() * data.length);
      const randomItem = data[currentIndex];

      const embed = buildEmbed('adhkar', {
        author: 'سلسلة الأذكار',
        title,
        description: blockquote(randomItem.text),
        fields: [
          { name: bold('التكرار'), value: randomItem.count, inline: true },
          { name: bold('الفضل'), value: randomItem.blessing, inline: true },
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
          author: 'سلسلة الأذكار',
          title,
          description: blockquote(item.text),
          fields: [
            { name: bold('التكرار'), value: item.count, inline: true },
            { name: bold('الفضل'), value: item.blessing, inline: true },
            { name: bold('العدد'), value: `${currentIndex + 1} / ${data.length}`, inline: true },
          ],
        });

        await i.update({ embeds: [newEmbed] });
      });

      collector.on('end', async () => {
        const disabledRow = ActionRowBuilder.from<ButtonBuilder>(row);
        disabledRow.components.forEach(c => c.setDisabled(true));
        await interaction.editReply({ components: [disabledRow] }).catch(() => {});
      });

      return;
    }

    if (sub === 'دعاء-اليوم') {
      const index = new Date().getDate() % duaToday.length;
      const dua = duaToday[index];

      const embed = buildEmbed('adhkar', {
        author: 'سلسلة الأدعية',
        title: 'دعاء اليوم',
        description: blockquote(dua.text),
        fields: [
          { name: bold('الفضل'), value: dua.blessing, inline: false },
        ],
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (sub === 'مسبحة') {
      let count = 0;
      const totalGoal = 33;
      let currentTasbih = 0;
      const tasbih = ['سُبْحَانَ اللَّهِ', 'الْحَمْدُ لِلَّهِ', 'اللَّهُ أَكْبَرُ'];

      function buildCounter(count: number): string {
        return `${arabicNumeral(count)} / ${arabicNumeral(totalGoal)}`;
      }

      function buildMsbahaEmbed() {
        return buildEmbed('adhkar', {
          author: 'المسبحة الرقمية',
          title: '۞ ذكر الله',
          description: blockquote(tasbih[currentTasbih]),
          fields: [
            { name: bold('التسبيحة'), value: tasbih[currentTasbih], inline: true },
            { name: bold('العدد'), value: `${arabicNumeral(count)}`, inline: true },
            { name: bold('التقدم'), value: `${Math.round((count / totalGoal) * 100)}%`, inline: true },
          ],
        });
      }

      const tasbihBtn = new ButtonBuilder()
        .setCustomId('msbaha_add')
        .setLabel('⃣ سبح')
        .setStyle(ButtonStyle.Primary);

      const counterBtn = new ButtonBuilder()
        .setCustomId('msbaha_counter')
        .setLabel(buildCounter(0))
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      const resetBtn = new ButtonBuilder()
        .setCustomId('msbaha_reset')
        .setLabel('إعادة')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(tasbihBtn, counterBtn, resetBtn);

      const reply = await interaction.reply({ embeds: [buildMsbahaEmbed()], components: [row], fetchReply: true });

      const filter = (i: any) => i.user.id === interaction.user.id;
      const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 300000 });

      collector.on('collect', async i => {
        if (i.customId === 'msbaha_reset') {
          count = 0;
          currentTasbih = 0;
        } else if (i.customId === 'msbaha_add') {
          count++;
          if (count > totalGoal) {
            currentTasbih = (currentTasbih + 1) % tasbih.length;
            count = 1;
          }
        }

        counterBtn.setLabel(buildCounter(count));

        await i.update({ embeds: [buildMsbahaEmbed()], components: [row] });
      });

      collector.on('end', async () => {
        const disabledRow = ActionRowBuilder.from<ButtonBuilder>(row);
        disabledRow.components.forEach(c => c.setDisabled(true));
        await interaction.editReply({ components: [disabledRow] }).catch(() => {});
      });

      return;
    }
  },
  category: 'adhkar',
} as Command;
