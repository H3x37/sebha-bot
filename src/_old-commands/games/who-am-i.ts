import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { figures } from '../../data/figures';
import prisma from '../../utils/prisma';

const levels = [
  { name: 'طالب علم', minPoints: 0 },
  { name: 'مثقف', minPoints: 100 },
  { name: 'عالم', minPoints: 300 },
  { name: 'شيخ', minPoints: 600 },
  { name: 'قدوة', minPoints: 1000 },
];

async function ensureUser(userId: string, username: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: { username },
    create: { id: userId, username },
  });
  await prisma.userPoint.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

function getLevel(total: number) {
  let current = levels[0];
  for (const l of levels) {
    if (total >= l.minPoints) current = l;
  }
  return current;
}

export default {
  data: new SlashCommandBuilder()
    .setName('من-أنا')
    .setDescription('خمن الشخصية الإسلامية'),

  async execute(interaction: ChatInputCommandInteraction) {
    const figure = figures[Math.floor(Math.random() * figures.length)];
    let clueIndex = 0;
    let guessed = false;

    const revealBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('clue')
        .setLabel('🔍 تخمين')
        .setStyle(ButtonStyle.Primary),
    );

    const guessBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('guess')
        .setLabel('💡 تخمين')
        .setStyle(ButtonStyle.Success),
    );

    const embed = buildEmbed('games', {
      title: '🕋 من أنا؟',
      description: `**الدليل ١:** ${figure.clues[0]}`,
      footer: 'اضغط "تخمين" للإجابة • أو "تخمين" لكشف الدليل التالي',
    });

    const reply = await interaction.reply({
      embeds: [embed],
      components: [revealBtn, guessBtn],
      fetchReply: true,
    });

    const filter = (i: any) => i.user.id === interaction.user.id;

    const collector = reply.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
      time: 60000,
    });

    collector.on('collect', async (collected) => {
      if (collected.customId === 'clue') {
        clueIndex++;
        if (clueIndex >= 3) {
          const overEmbed = buildEmbed('games', {
            title: '🔍 الإجابة',
            description: `**${figure.name}**\n\n${figure.desc}`,
            fields: [
            { name: 'الدلائل', value: figure.clues.map((c, i) => `**${i + 1}.** ${c}`).join('\n') },
            ],
          });
          await collected.update({ embeds: [overEmbed], components: [] });
          collector.stop('finished');
          return;
        }

        const nextEmbed = buildEmbed('games', {
          title: '🕋 من أنا؟',
          description: figure.clues.slice(0, clueIndex + 1).map((c, i) => `**الدليل ${i + 1}:** ${c}`).join('\n'),
          footer: 'اضغط "تخمين" للإجابة',
        });

        await collected.update({ embeds: [nextEmbed] });
      } else if (collected.customId === 'guess' && !guessed) {
        guessed = true;
        collector.stop('guessed');

        const points = clueIndex === 0 ? 20 : clueIndex === 1 ? 10 : 5;

        await ensureUser(interaction.user.id, interaction.user.username);

        await prisma.gameScore.create({
          data: {
            userId: interaction.user.id,
            gameType: 'who-am-i',
            score: points,
            correct: 1,
            wrong: 0,
          },
        });

        const userPoint = await prisma.userPoint.findUnique({ where: { userId: interaction.user.id } });
        const newTotal = (userPoint?.total || 0) + points;
        const newGamePts = (userPoint?.gamePts || 0) + points;
        const currentLevel = getLevel(newTotal);

        await prisma.userPoint.update({
          where: { userId: interaction.user.id },
          data: {
            total: newTotal,
            gamePts: newGamePts,
            level: currentLevel.name,
          },
        });

        const allClues = figure.clues.map((c, i) => `**${i + 1}.** ${c}`).join('\n');

        const resultEmbed = buildEmbed('games', {
          title: '🎉 إجابة صحيحة!',
          description: `**${figure.name}**\n\n${figure.desc}`,
          fields: [
            { name: 'الدلائل', value: allClues },
            { name: 'النقاط', value: `+${points}`, inline: true },
            { name: 'المستوى', value: currentLevel.name, inline: true },
          ],
        });

        await collected.update({ embeds: [resultEmbed], components: [] });
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        const endEmbed = buildEmbed('games', {
          title: '⏰ انتهى الوقت',
          description: `**${figure.name}**\n\n${figure.desc}`,
          fields: [
            { name: 'الدلائل', value: figure.clues.map((c, i) => `**${i + 1}.** ${c}`).join('\n') },
          ],
        });
        await interaction.editReply({ embeds: [endEmbed], components: [] });
      }
    });
  },
  category: 'games',
} as Command;
