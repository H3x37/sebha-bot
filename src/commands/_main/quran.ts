import {
  SlashCommandBuilder, ChatInputCommandInteraction
} from 'discord.js';
import { Command } from '../../types';
import { buildEmbed, errorEmbed } from '../../utils/embed';
import { bold, blockquote, arabicNumeral } from '../../utils/format';
import prisma from '../../utils/prisma';
import { fetchQuranVerse, fetchQuranPage, searchQuran, quranApi } from '../../utils/api';
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

export default {
  data: new SlashCommandBuilder()
    .setName('قرآن')
    .setDescription('أوامر القرآن الكريم')
    .addSubcommand(sub =>
      sub.setName('آية')
        .setDescription('عرض آية قرآنية')
        .addIntegerOption(option =>
          option.setName('السورة')
            .setDescription('رقم السورة (1-114)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(114))
        .addIntegerOption(option =>
          option.setName('الآية')
            .setDescription('رقم الآية')
            .setRequired(true)
            .setMinValue(1)))
    .addSubcommand(sub =>
      sub.setName('آيات')
        .setDescription('عرض مجموعة آيات من سورة معينة')
        .addIntegerOption(option =>
          option.setName('السورة')
            .setDescription('رقم السورة (1-114)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(114))
        .addIntegerOption(option =>
          option.setName('من')
            .setDescription('رقم البداية')
            .setRequired(true)
            .setMinValue(1))
        .addIntegerOption(option =>
          option.setName('إلى')
            .setDescription('رقم النهاية')
            .setRequired(true)
            .setMinValue(1)))
    .addSubcommand(sub =>
      sub.setName('آية-يومية')
        .setDescription('آية عشوائية من القرآن الكريم'))
    .addSubcommand(sub =>
      sub.setName('بحث')
        .setDescription('البحث في القرآن الكريم')
        .addStringOption(option =>
          option.setName('كلمة')
            .setDescription('الكلمة أو العبارة للبحث')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('تفسير')
        .setDescription('تفسير آية من القرآن الكريم')
        .addIntegerOption(option =>
          option.setName('السورة')
            .setDescription('رقم السورة (1-114)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(114))
        .addIntegerOption(option =>
          option.setName('الآية')
            .setDescription('رقم الآية')
            .setRequired(true)
            .setMinValue(1)))
    .addSubcommand(sub =>
      sub.setName('صفحة')
        .setDescription('عرض صفحة من المصحف')
        .addIntegerOption(option =>
          option.setName('رقم')
            .setDescription('رقم الصفحة (1-604)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(604)))
    .addSubcommand(sub =>
      sub.setName('راديو')
        .setDescription('تشغيل القرآن الكريم في الروم الصوتي')
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
            )))
    .addSubcommand(sub =>
      sub.setName('ختمة')
        .setDescription('إدارة الختمة الجماعية')
        .addStringOption(option =>
          option.setName('تسجيل')
            .setDescription('اختر العملية')
            .setRequired(true)
            .addChoices(
              { name: 'انضمام', value: 'join' },
              { name: 'تقدم', value: 'progress' },
              { name: 'حالتي', value: 'mystatus' },
            ))),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'آية') {
      const surah = interaction.options.getInteger('السورة', true);
      const ayah = interaction.options.getInteger('الآية', true);

      try {
        const data = await fetchQuranVerse(surah, ayah);

        const embed = buildEmbed('quran', {
          author: 'القرآن الكريم',
          title: `📖 ${data.surah.name} — الآية ${data.numberInSurah}`,
          description: blockquote(data.text),
          fields: [
            { name: bold('الجزء'), value: `${data.juz}`, inline: true },
            { name: bold('الصفحة'), value: `${data.page}`, inline: true },
            { name: bold('الحزب'), value: `${data.hizbQuarter}`, inline: true },
          ],
        });

        await interaction.reply({ embeds: [embed] });
      } catch {
        await interaction.reply({ embeds: [errorEmbed('لم يتم العثور على الآية. تأكد من رقم السورة والآية.')] });
      }
      return;
    }

    if (subcommand === 'آيات') {
      const surah = interaction.options.getInteger('السورة', true);
      const from = interaction.options.getInteger('من', true);
      const to = interaction.options.getInteger('إلى', true);

      if (from > to) {
        await interaction.reply({ embeds: [errorEmbed('رقم البداية يجب أن يكون أقل أو يساوي رقم النهاية.')] });
        return;
      }

      if (to - from > 50) {
        await interaction.reply({ embeds: [errorEmbed('الحد الأقصى للمدى هو 50 آية.')] });
        return;
      }

      try {
        const { data } = await quranApi.get(`/surah/${surah}`);
        const surahData = data.data;

        const ayahs = surahData.ayahs.filter(
          (a: any) => a.numberInSurah >= from && a.numberInSurah <= to
        );

        if (ayahs.length === 0) {
          await interaction.reply({ embeds: [errorEmbed('لم يتم العثور على آيات في هذا النطاق.')] });
          return;
        }

        const description = ayahs.map((a: any) =>
          `**(${a.numberInSurah})** ${a.text}`
        ).join('\n\n');

        const embed = buildEmbed('quran', {
          author: 'القرآن الكريم',
          title: `📖 ${surahData.name} — ${from}-${to}`,
          description,
          fields: [
            { name: bold('عدد الآيات'), value: `${ayahs.length}`, inline: true },
            { name: bold('نوع الوحي'), value: surahData.revelationType === 'Meccan' ? 'مكية' : 'مدنية', inline: true },
          ],
        });

        await interaction.reply({ embeds: [embed] });
      } catch {
        await interaction.reply({ embeds: [errorEmbed('حدث خطأ أثناء جلب الآيات. تأكد من رقم السورة.')] });
      }
      return;
    }

    if (subcommand === 'آية-يومية') {
      const surahsWithThreeOrMore = Array.from({ length: 114 }, (_, i) => i + 1);

      const tryFetch = async (): Promise<any> => {
        const surah = surahsWithThreeOrMore[Math.floor(Math.random() * surahsWithThreeOrMore.length)];
        const ayah = Math.floor(Math.random() * 3) + 1;
        return fetchQuranVerse(surah, ayah);
      };

      let data: any;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          data = await tryFetch();
          break;
        } catch {
          if (attempt === 4) {
            await interaction.reply({ embeds: [errorEmbed('تعذر جلب آية اليوم. حاول مرة أخرى لاحقاً.')] });
            return;
          }
        }
      }

      const embed = buildEmbed('quran', {
        author: 'القرآن الكريم',
        title: `📖 آية اليوم — ${data.surah.name} (${data.numberInSurah})`,
        description: blockquote(data.text),
        fields: [
          { name: bold('الجزء'), value: `${data.juz}`, inline: true },
          { name: bold('الصفحة'), value: `${data.page}`, inline: true },
        ],
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'بحث') {
      const query = interaction.options.getString('كلمة', true);

      try {
        const data = await searchQuran(query);

        if (!data.matches || data.matches.length === 0) {
          await interaction.reply({ embeds: [errorEmbed('لم يتم العثور على نتائج لـ "' + query + '".')] });
          return;
        }

        const total = data.matches.length;
        const results = data.matches.slice(0, 10);
        const description = results.map((m: any, i: number) =>
          `**${i + 1}.** سورة ${m.surah.name} (${m.numberInSurah})\n${m.text}`
        ).join('\n\n');

        const embed = buildEmbed('quran', {
          author: 'البحث في القرآن',
          title: `📖 ${query}`,
          description,
          fields: [
            { name: bold('عدد النتائج'), value: '' + total, inline: true },
            { name: bold('النتائج المعروضة'), value: Math.min(total, 10) + ' من ' + total, inline: true },
          ],
        });

        await interaction.reply({ embeds: [embed] });
      } catch {
        await interaction.reply({ embeds: [errorEmbed('حدث خطأ أثناء البحث. حاول مرة أخرى.')] });
      }
      return;
    }

    if (subcommand === 'تفسير') {
      const surah = interaction.options.getInteger('السورة', true);
      const ayah = interaction.options.getInteger('الآية', true);

      try {
        const verseData = await fetchQuranVerse(surah, ayah);
        let tafsirText = '';

        try {
          const { data } = await quranApi.get(`/ayah/${surah}:${ayah}/ar.muyassar`);
          tafsirText = data.data.text;
        } catch {
          tafsirText = 'التفسير غير متاح لهذه الآية حالياً.';
        }

        const embed = buildEmbed('quran', {
          author: 'تفسير القرآن',
          title: `📖 ${verseData.surah.name} — ${verseData.numberInSurah}`,
          description: `${blockquote(verseData.text)}\n━━━━━━━━━━━━━━━━\n${blockquote(tafsirText)}`,
          fields: [
            { name: bold('الجزء'), value: `${verseData.juz}`, inline: true },
            { name: bold('الصفحة'), value: `${verseData.page}`, inline: true },
          ],
        });

        await interaction.reply({ embeds: [embed] });
      } catch {
        await interaction.reply({ embeds: [errorEmbed('لم يتم العثور على الآية أو تفسيرها. تأكد من رقم السورة والآية.')] });
      }
      return;
    }

    if (subcommand === 'صفحة') {
      const pageNum = interaction.options.getInteger('رقم', true);

      try {
        const data = await fetchQuranPage(pageNum);

        const ayahs = data.ayahs.slice(0, 15);
        const description = ayahs.map((a: any) => {
          const surahName = a.surah.name;
          return `**${surahName} (${a.numberInSurah})** ${a.text}`;
        }).join('\n\n');

        const embed = buildEmbed('quran', {
          author: 'المصحف الشريف',
          title: `📖 الصفحة ${data.number}`,
          description,
          fields: [
            { name: bold('الآيات المعروضة'), value: `${ayahs.length}`, inline: true },
            { name: bold('إجمالي الآيات'), value: `${data.ayahs.length}`, inline: true },
          ],
        });

        await interaction.reply({ embeds: [embed] });
      } catch {
        await interaction.reply({ embeds: [errorEmbed('لم يتم العثور على الصفحة. تأكد من أن الرقم بين 1 و 604.')] });
      }
      return;
    }

    if (subcommand === 'راديو') {
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
          } catch {
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
          description: `✅ يتم الآن تشغيل القرآن الكريم في **${voiceChannel.name}**\n\n**القارئ:** ${reciter.name}\n**الحالة:** 🟢 يعمل 24/7\n\nاستخدم \`/قرآن راديو حالة:إيقاف\` للإيقاف.`,
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
      return;
    }

    if (subcommand === 'ختمة') {
      const action = interaction.options.getString('تسجيل', true);

      if (!interaction.guildId) {
        await interaction.reply({ embeds: [errorEmbed('هذا الأمر يعمل فقط في السيرفرات.')], flags: 64 });
        return;
      }

      const userId = interaction.user.id;
      const guildId = interaction.guildId;

      try {
        await prisma.guild.upsert({
          where: { id: guildId },
          update: { name: interaction.guild?.name || '' },
          create: { id: guildId, name: interaction.guild?.name || '' },
        });

        await prisma.user.upsert({
          where: { id: userId },
          update: { username: interaction.user.username },
          create: { id: userId, username: interaction.user.username },
        });

        if (action === 'join') {
          await prisma.khatmaParticipant.upsert({
            where: { guildId_userId: { guildId, userId } },
            update: {},
            create: { guildId, userId },
          });

          await prisma.khatmaProgress.upsert({
            where: { userId_guildId: { userId, guildId } },
            update: {},
            create: { userId, guildId, juz: 1, page: 1 },
          });

          const embed = buildEmbed('quran', {
            title: 'تم الانضمام إلى الختمة',
            description: `مرحباً بك في الختمة الجماعية في سيرفر **${interaction.guild?.name}**!\n\nاستخدم \`/قرآن ختمة تسجيل:حالتي\` لمتابعة تقدمك.`,
          });

          await interaction.reply({ embeds: [embed] });
        } else if (action === 'progress') {
          const participants = await prisma.khatmaParticipant.findMany({
            where: { guildId },
            include: { guild: true },
          });

          if (participants.length === 0) {
            await interaction.reply({ embeds: [errorEmbed('لا يوجد مشاركون في الختمة بعد. انضم باستخدام \`/قرآن ختمة تسجيل:انضمام\`.')] });
            return;
          }

          const totalJuz = 30;
          const submittedJuz = new Set<number>();
          for (const p of participants) {
            const juzList = p.juz ? p.juz.split(',').filter(Boolean).map(Number) : [];
            juzList.forEach(j => submittedJuz.add(j));
          }
          const completedCount = submittedJuz.size;
          const progressPercent = Math.round((completedCount / totalJuz) * 100);

          const participantList = participants.map(p => {
            const juzList = p.juz ? p.juz.split(',').filter(Boolean).map(Number) : [];
            return `<@${p.userId}> - ${juzList.length} أجزاء`;
          }).join('\n') || 'لا يوجد';

          const embed = buildEmbed('quran', {
            title: `تقدم الختمة - ${interaction.guild?.name}`,
            description: `**تم إكمال ${completedCount} من ${totalJuz} جزء (${progressPercent}%)**`,
            fields: [
              { name: 'عدد المشاركين', value: `${participants.length}`, inline: true },
              { name: 'الأجزاء المنجزة', value: `${completedCount} / ${totalJuz}`, inline: true },
              { name: 'المشاركون', value: participantList },
            ],
          });

          await interaction.reply({ embeds: [embed] });
        } else if (action === 'mystatus') {
          const progress = await prisma.khatmaProgress.findUnique({
            where: { userId_guildId: { userId, guildId } },
          });

          const participant = await prisma.khatmaParticipant.findUnique({
            where: { guildId_userId: { guildId, userId } },
          });

          if (!participant) {
            await interaction.reply({ embeds: [errorEmbed('أنت لست مشتركاً في الختمة. استخدم \`/قرآن ختمة تسجيل:انضمام\` للانضمام.')] });
            return;
          }

          const currentJuz = progress?.juz || 1;
          const currentPage = progress?.page || 1;
          const completedJuzList = participant.juz ? participant.juz.split(',').filter(Boolean).map(Number) : [];
          const completedJuzCount = completedJuzList.length;

          const embed = buildEmbed('quran', {
            title: 'حالتي في الختمة',
            fields: [
              { name: 'الجزء الحالي', value: `${currentJuz}`, inline: true },
              { name: 'الصفحة الحالية', value: `${currentPage}`, inline: true },
              { name: 'الأجزاء المنجزة', value: `${completedJuzCount} / 30`, inline: true },
              { name: 'الأجزاء المسجلة', value: completedJuzCount > 0 ? completedJuzList.join('، ') : 'لا يوجد', inline: false },
            ],
          });

          await interaction.reply({ embeds: [embed] });
        }
      } catch {
        await interaction.reply({ embeds: [errorEmbed('حدث خطأ أثناء تنفيذ العملية. حاول مرة أخرى.')] });
      }
      return;
    }
  },
  category: 'quran',
} as Command;
