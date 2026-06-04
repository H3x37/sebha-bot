import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import axios from 'axios';

interface HijriDateData {
  date: string;
  day: string;
  month: {
    number: number;
    en: string;
    ar: string;
  };
  year: string;
}

interface GregorianDateData {
  date: string;
  day: string;
  month: {
    number: number;
    en: string;
    ar: string;
  };
  year: string;
}

interface ApiResponse {
  code: number;
  status: string;
  data: {
    gregorian: GregorianDateData;
    hijri: HijriDateData;
  };
}

const islamicOccasions: [number, number, string][] = [
  [1, 1, '📅 رأس السنة الهجرية - بداية العام الهجري الجديد'],
  [1, 10, '🌙 يوم عاشوراء - صيامه يكفر سنة ماضية. وفيه نجى الله موسى عليه السلام من فرعون'],
  [3, 12, '🕌 المولد النبوي الشريف - مولد خير البشر محمد صلى الله عليه وسلم'],
  [3, 17, '🌙 وفاة النبي صلى الله عليه وسلم عند بعض أهل العلم'],
  [7, 27, '🌟 رحلة الإسراء والمعراج - فرضت فيها الصلاة'],
  [8, 15, '🌙 ليلة النصف من شعبان - ليلة البراءة'],
  [9, 1, '☪️ أول أيام شهر رمضان المبارك - شهر القرآن والصيام'],
  [9, 10, '🌙 وفاة خديجة بنت خويلد رضي الله عنها - عام الحزن'],
  [9, 17, '⚔️ غزوة بدر الكبرى - الفرقان - 2 هـ'],
  [9, 20, '🕊️ فتح مكة المكرمة - 8 هـ'],
  [9, 21, '🌙 وفاة الإمام علي بن أبي طالب رضي الله عنه - 40 هـ'],
  [9, 27, '🌙 ليلة القدر - خير من ألف شهر'],
  [10, 1, '🎉 عيد الفطر المبارك'],
  [12, 9, '🌅 يوم عرفة - وقفة الحج الأكبر'],
  [12, 10, '🕋 عيد الأضحى المبارك - عيد النحر'],
  [12, 12, '🌙 وفاة النبي صلى الله عليه وسلم - 11 هـ عند بعض الروايات'],
];

function getIslamicOccasion(hijriMonth: number, hijriDay: number): string | null {
  for (const [month, day, description] of islamicOccasions) {
    if (month === hijriMonth && day === hijriDay) {
      return description;
    }
  }
  return null;
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export default {
  data: new SlashCommandBuilder()
    .setName('التاريخ-الهجري')
    .setDescription('اليوم في التقويم الهجري والميلادي مع المناسبات'),

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

      const { hijri, gregorian } = response.data;

      const hijriMonth = parseInt(hijri.month.number.toString(), 10);
      const hijriDay = parseInt(hijri.day, 10);

      const occasion = getIslamicOccasion(hijriMonth, hijriDay);

      const fields = [
        {
          name: 'التاريخ الهجري',
          value: `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`,
          inline: false,
        },
        {
          name: 'التاريخ الميلادي',
          value: formatDate(gregorian.date),
          inline: false,
        },
      ];

      if (occasion) {
        fields.push({
          name: 'مناسبة اليوم',
          value: occasion,
          inline: false,
        });
      }

      const embed = buildEmbed('history', {
        title: 'التاريخ الهجري',
        fields,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({
        embeds: [errorEmbed('تعذر جلب التاريخ الهجري. حاول مرة أخرى لاحقاً.')],
      });
    }
  },
  category: 'history',
} as Command;
