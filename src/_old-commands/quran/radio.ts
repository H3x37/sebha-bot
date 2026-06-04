import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import axios from 'axios';

interface ReciterInfo {
  name: string;
  server: string;
  surahList: number[];
}

let recitersCache: Record<string, ReciterInfo> | null = null;
const players = new Map<string, any>();

const reciterSlugs: Record<string, string> = {
  minsh: 'منشاوي',
  afasy: 'عفاسي',
  sudais: 'سدنيس',
  shuraym: 'شريم',
  basit: 'باسط',
};

async function fetchReciters(): Promise<Record<string, ReciterInfo>> {
  if (recitersCache) return recitersCache;

  const { data } = await axios.get('https://mp3quran.net/api/v3/reciters?limit=200', {
    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
  });

  const result: Record<string, ReciterInfo> = {};
  const reciterNames: Record<string, string[]> = {
    minsh: ['محمد صديق المنشاوي', 'منشاوي'],
    afasy: ['مشاري العفاسي', 'عفاسي'],
    sudais: ['عبدالرحمن السديس', 'السديس'],
    shuraym: ['سعود الشريم', 'الشريم'],
    basit: ['عبدالباسط عبدالصمد', 'عبد الباسط'],
  };

  for (const [key, tokens] of Object.entries(reciterNames)) {
    let reciter = null;
    for (const token of tokens) {
      reciter = data.reciters.find((r: any) => r.name.includes(token));
      if (reciter) break;
    }
    if (!reciter) {
      // fuzzy fallback: search for any token
      for (const token of tokens) {
        reciter = data.reciters.find((r: any) =>
          token.split('').every((ch: string) => r.name.includes(ch))
        );
        if (reciter) break;
      }
    }
    if (reciter && reciter.moshaf?.length > 0) {
      const mainMoshaf = reciter.moshaf.find((m: any) => m.moshaf_type === 11) || reciter.moshaf[0];
      result[key] = {
        name: reciter.name,
        server: mainMoshaf.server,
        surahList: mainMoshaf.surah_list.split(',').map(Number),
      };
    }
  }

  recitersCache = result;
  return result;
}

export default {
  data: new SlashCommandBuilder()
    .setName('راديو-قرآن')
    .setDescription('تشغيل القرآن الكريم في الروم الصوتي 24/7')
    .addStringOption(option =>
      option.setName('القارئ')
        .setDescription('اختر القارئ')
        .setRequired(true)
        .addChoices(
          { name: 'محمد صديق المنشاوي', value: 'minsh' },
          { name: 'مشاري العفاسي', value: 'afasy' },
          { name: 'عبد الرحمن السديس', value: 'sudais' },
          { name: 'سعود الشريم', value: 'shuraym' },
          { name: 'عبد الباسط عبد الصمد', value: 'basit' },
        ))
    .addStringOption(option =>
      option.setName('حالة')
        .setDescription('تشغيل أو إيقاف')
        .addChoices(
          { name: 'تشغيل', value: 'play' },
          { name: 'إيقاف', value: 'stop' },
        )),

  async execute(interaction: ChatInputCommandInteraction) {
    const qari = interaction.options.getString('القارئ', true);
    const action = interaction.options.getString('حالة') || 'play';
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات')], flags: 64 });
      return;
    }

    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member?.voice.channel;

    if (action === 'stop') {
      const existing = players.get(guildId);
      if (existing) {
        existing.player.stop();
        existing.connection.destroy();
        players.delete(guildId);
      }
      await interaction.reply({
        embeds: [buildEmbed('quran', {
          title: 'تم إيقاف الراديو',
          description: 'تم قطع الاتصال بالروم الصوتي.',
        })],
      });
      return;
    }

    if (!voiceChannel) {
      await interaction.reply({ embeds: [errorEmbed('يجب أن تكون في روم صوتي أولاً.')], flags: 64 });
      return;
    }

    await interaction.deferReply();

    try {
      const reciters = await fetchReciters();
      const reciter = reciters[qari];

      if (!reciter) {
        await interaction.editReply({ embeds: [errorEmbed('لم يتم العثور على القارئ المطلوب.')] });
        return;
      }

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      let currentIndex = 0;

      function playNext() {
        const surahNum = reciter.surahList[currentIndex];
        const surahStr = String(surahNum).padStart(3, '0');
        const url = reciter.server + surahStr + '.mp3';

        try {
          const resource = createAudioResource(url);
          player.play(resource);
        } catch (err) {
          currentIndex = (currentIndex + 1) % reciter.surahList.length;
          playNext();
        }
      }

      playNext();
      connection.subscribe(player);

      players.set(guildId, { player, connection, reciter });

      player.on(AudioPlayerStatus.Idle, () => {
        currentIndex = (currentIndex + 1) % reciter.surahList.length;
        playNext();
      });

      player.on('error', () => {
        currentIndex = (currentIndex + 1) % reciter.surahList.length;
        playNext();
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5000),
          ]);
        } catch {
          players.delete(guildId);
        }
      });

      const firstSurahName = getSurahName(reciter.surahList[0]);
      const nextSurahName = reciter.surahList.length > 1 ? getSurahName(reciter.surahList[1]) : '—';

      const embed = buildEmbed('quran', {
        title: 'راديو القرآن',
        description: `✅ يتم الآن تشغيل القرآن الكريم في **${voiceChannel.name}**\n\n**القارئ:** ${reciter.name}\n**الحالة:** 🟢 يعمل 24/7\n\nاستخدم \`/راديو-قرآن حالة:إيقاف\` للإيقاف.`,
        fields: [
          { name: 'السورة الحالية', value: firstSurahName, inline: true },
          { name: 'القادم', value: `→ ${nextSurahName}`, inline: true },
        ],
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ embeds: [errorEmbed('حدث خطأ أثناء تشغيل الراديو. تأكد من صلاحية "التحدث" في الروم الصوتي.')] });
    }
  },
  category: 'quran',
} as Command;

function getSurahName(num: number): string {
  const names: Record<number, string> = {
    1: 'الفاتحة', 2: 'البقرة', 3: 'آل عمران', 4: 'النساء', 5: 'المائدة',
    6: 'الأنعام', 7: 'الأعراف', 8: 'الأنفال', 9: 'التوبة', 10: 'يونس',
    11: 'هود', 12: 'يوسف', 13: 'الرعد', 14: 'إبراهيم', 15: 'الحجر',
    16: 'النحل', 17: 'الإسراء', 18: 'الكهف', 19: 'مريم', 20: 'طه',
    21: 'الأنبياء', 22: 'الحج', 23: 'المؤمنون', 24: 'النور', 25: 'الفرقان',
    26: 'الشعراء', 27: 'النمل', 28: 'القصص', 29: 'العنكبوت', 30: 'الروم',
    31: 'لقمان', 32: 'السجدة', 33: 'الأحزاب', 34: 'سبأ', 35: 'فاطر',
    36: 'يس', 37: 'الصافات', 38: 'ص', 39: 'الزمر', 40: 'غافر',
    41: 'فصلت', 42: 'الشورى', 43: 'الزخرف', 44: 'الدخان', 45: 'الجاثية',
    46: 'الأحقاف', 47: 'محمد', 48: 'الفتح', 49: 'الحجرات', 50: 'ق',
    51: 'الذاريات', 52: 'الطور', 53: 'النجم', 54: 'القمر', 55: 'الرحمن',
    56: 'الواقعة', 57: 'الحديد', 58: 'المجادلة', 59: 'الحشر', 60: 'الممتحنة',
    61: 'الصف', 62: 'الجمعة', 63: 'المنافقون', 64: 'التغابن', 65: 'الطلاق',
    66: 'التحريم', 67: 'الملك', 68: 'القلم', 69: 'الحاقة', 70: 'المعارج',
    71: 'نوح', 72: 'الجن', 73: 'المزمل', 74: 'المدثر', 75: 'القيامة',
    76: 'الإنسان', 77: 'المرسلات', 78: 'النبأ', 79: 'النازعات', 80: 'عبس',
    81: 'التكوير', 82: 'الانفطار', 83: 'المطففين', 84: 'الانشقاق', 85: 'البروج',
    86: 'الطارق', 87: 'الأعلى', 88: 'الغاشية', 89: 'الفجر', 90: 'البلد',
    91: 'الشمس', 92: 'الليل', 93: 'الضحى', 94: 'الشرح', 95: 'التين',
    96: 'العلق', 97: 'القدر', 98: 'البينة', 99: 'الزلزلة', 100: 'العاديات',
    101: 'القارعة', 102: 'التكاثر', 103: 'العصر', 104: 'الهمزة', 105: 'الفيل',
    106: 'قريش', 107: 'الماعون', 108: 'الكوثر', 109: 'الكافرون', 110: 'النصر',
    111: 'المسد', 112: 'الإخلاص', 113: 'الفلق', 114: 'الناس',
  };
  return `(${num}) ${names[num] || 'غير معروف'}`;
}
