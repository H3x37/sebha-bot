import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';

const currencyNames: Record<string, string> = {
  USD: 'دولار أمريكي',
  EUR: 'يورو',
  SAR: 'ريال سعودي',
  AED: 'درهم إماراتي',
  EGP: 'جنيه مصري',
};

const nisabValues: Record<string, { gold: number; silver: number }> = {
  USD: { gold: 6375, silver: 535 },
  EUR: { gold: 5900, silver: 495 },
  SAR: { gold: 23900, silver: 2005 },
  AED: { gold: 23400, silver: 1965 },
  EGP: { gold: 308000, silver: 25850 },
};

export default {
  data: new SlashCommandBuilder()
    .setName('زكاة-المال')
    .setDescription('حساب زكاة المال')
    .addNumberOption(option =>
      option.setName('المبلغ')
        .setDescription('المبلغ الذي تريد حساب زكاته')
        .setRequired(true)
        .setMinValue(0))
    .addStringOption(option =>
      option.setName('العملة')
        .setDescription('عملة المبلغ')
        .setRequired(true)
        .addChoices(
          { name: 'دولار أمريكي (USD)', value: 'USD' },
          { name: 'يورو (EUR)', value: 'EUR' },
          { name: 'ريال سعودي (SAR)', value: 'SAR' },
          { name: 'درهم إماراتي (AED)', value: 'AED' },
          { name: 'جنيه مصري (EGP)', value: 'EGP' },
          { name: 'أخرى', value: 'other' },
        ))
    .addStringOption(option =>
      option.setName('عملة-أخرى')
        .setDescription('اسم العملة إذا اخترت "أخرى"')
        .setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getNumber('المبلغ', true);
    const currency = interaction.options.getString('العملة', true);
    const otherCurrency = interaction.options.getString('عملة-أخرى');

    if (currency === 'other' && !otherCurrency) {
      await interaction.reply({ embeds: [errorEmbed('يرجى تحديد اسم العملة الأخرى.')] });
      return;
    }

    const zakat = amount * 0.025;
    const label = currency === 'other' ? otherCurrency! : currencyNames[currency];

    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: 'المبلغ', value: `${amount.toFixed(2)} ${label}`, inline: true },
      { name: 'مقدار الزكاة (2.5%)', value: `${zakat.toFixed(2)} ${label}`, inline: true },
    ];

    if (currency !== 'other') {
      const nisab = nisabValues[currency];
      const reachesNisab = amount >= nisab.silver;
      fields.push(
        { name: 'نصاب الذهب (85 جم)', value: `${nisab.gold.toFixed(2)} ${label}`, inline: true },
        { name: 'نصاب الفضة (595 جم)', value: `${nisab.silver.toFixed(2)} ${label}`, inline: true },
        { name: 'حالة النصاب', value: reachesNisab ? '✅ يبلغ النصاب' : '❌ لا يبلغ النصاب', inline: false },
      );
    }

    const embed = buildEmbed('zakat', {
      title: 'حساب زكاة المال',
      fields,
    });

    await interaction.reply({ embeds: [embed] });
  },
  category: 'zakat',
} as Command;
