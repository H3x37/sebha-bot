import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed } from '../../utils/embed';

const goldPerGram = 75;
const silverPerGram = 0.9;

const currencies = [
  { code: 'USD', name: 'دولار أمريكي', rate: 1 },
  { code: 'EUR', name: 'يورو', rate: 1.08 },
  { code: 'SAR', name: 'ريال سعودي', rate: 0.267 },
  { code: 'AED', name: 'درهم إماراتي', rate: 0.272 },
  { code: 'EGP', name: 'جنيه مصري', rate: 0.0207 },
];

export default {
  data: new SlashCommandBuilder()
    .setName('نصاب-اليوم')
    .setDescription('نصاب الذهب والفضة لهذا اليوم'),

  async execute(interaction: ChatInputCommandInteraction) {
    const goldNisab = 85 * goldPerGram;
    const silverNisab = 595 * silverPerGram;

    const today = new Date().toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const fields: { name: string; value: string; inline?: boolean }[] = [
      {
        name: 'التاريخ',
        value: today,
        inline: false,
      },
      {
        name: 'نصاب الذهب (85 جم)',
        value: currencies
          .map(c => `${c.name}: ${(goldNisab * c.rate).toFixed(2)} ${c.code}`)
          .join('\n'),
        inline: true,
      },
      {
        name: 'نصاب الفضة (595 جم)',
        value: currencies
          .map(c => `${c.name}: ${(silverNisab * c.rate).toFixed(2)} ${c.code}`)
          .join('\n'),
        inline: true,
      },
    ];

    const embed = buildEmbed('zakat', {
      title: 'نصاب الزكاة لهذا اليوم',
      fields,
      footer: 'الأسعار تقريبية وقد تختلف حسب السوق',
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'zakat',
} as Command;
