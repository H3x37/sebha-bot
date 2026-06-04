import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { historicalEvents, HistoricalEvent } from '../../data/events';
import axios from 'axios';

interface HijriData {
  day: string;
  month: {
    number: number;
    ar: string;
  };
  year: string;
}

interface ApiResponse {
  code: number;
  status: string;
  data: {
    hijri: HijriData;
  };
}

function getTodayEvents(hijriMonth: number, hijriDay: number): HistoricalEvent[] {
  return historicalEvents.filter(e => e.month === hijriMonth && e.day === hijriDay);
}

export default {
  data: new SlashCommandBuilder()
    .setName('حدث-اليوم')
    .setDescription('حدث تاريخي إسلامي في مثل هذا اليوم'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const gregDate = `${day}-${month}-${year}`;

      const { data: response } = await axios.get<ApiResponse>(
        `https://api.aladhan.com/v1/gToH?date=${gregDate}`
      );

      if (response.code !== 200) {
        throw new Error('API returned non-200 code');
      }

      const hijriData = response.data.hijri;
      const hijriMonth = hijriData.month.number;
      const hijriDay = parseInt(hijriData.day, 10);

      const todayEvents = getTodayEvents(hijriMonth, hijriDay);

      const event = todayEvents.length > 0
        ? todayEvents[Math.floor(Math.random() * todayEvents.length)]
        : historicalEvents[Math.floor(Math.random() * historicalEvents.length)];

      const embed = buildEmbed('history', {
        title: 'حدث تاريخي إسلامي',
        fields: [
          { name: 'العنوان', value: event.title, inline: false },
          { name: 'التاريخ الهجري', value: `${event.dateHijri} ${event.yearHijri}`, inline: true },
          { name: 'الوصف', value: event.description, inline: false },
          { name: 'الدلالة', value: event.significance, inline: false },
        ],
      });

      await interaction.editReply({ embeds: [embed] });
    } catch {
      const random = historicalEvents[Math.floor(Math.random() * historicalEvents.length)];
      const embed = buildEmbed('history', {
        title: 'حدث تاريخي إسلامي',
        fields: [
          { name: 'العنوان', value: random.title, inline: false },
          { name: 'التاريخ الهجري', value: `${random.dateHijri} ${random.yearHijri}`, inline: true },
          { name: 'الوصف', value: random.description, inline: false },
          { name: 'الدلالة', value: random.significance, inline: false },
        ],
      });
      await interaction.editReply({ embeds: [embed] });
    }
  },
  category: 'history',
} as Command;
