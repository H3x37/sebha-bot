import cron from 'node-cron';
import { Client, TextChannel, AttachmentBuilder } from 'discord.js';
import prisma from './utils/prisma';
import { buildEmbed } from './utils/embed';
import { generateDhikrImage } from './utils/image';
import { adhkar, morningAdhkar, eveningAdhkar } from './data/adhkar';
import { fetchQuranVerse } from './utils/api';

export function startScheduledTasks(client: Client) {
  cron.schedule('0 6 * * *', async () => {
    await sendAdhkar(client, 'morning');
  });

  cron.schedule('0 18 * * *', async () => {
    await sendAdhkar(client, 'evening');
  });

  cron.schedule('0 8 * * *', async () => {
    await sendDailyAyah(client);
  });

  cron.schedule('0 9 * * *', async () => {
    await sendDailyHadith(client);
  });
}

async function sendAdhkar(client: Client, time: 'morning' | 'evening') {
  const settings = await prisma.guildSetting.findMany({
    where: { adhkarChannel: { not: null } },
    include: { guild: true },
  });

  const selectedAdhkar = time === 'morning' ? morningAdhkar : eveningAdhkar;
  const title = time === 'morning' ? 'أذكار الصباح' : 'أذكار المساء';

  for (const setting of settings) {
    if (!setting.adhkarChannel) continue;
    try {
      const channel = client.channels.cache.get(setting.adhkarChannel) as TextChannel;
      if (!channel) continue;

      const items = selectedAdhkar.slice(0, 5);
      const imageBuffers: Buffer[] = [];

      for (const item of items) {
        try {
          const buf = await generateDhikrImage(item.text, item.count, item.blessing);
          imageBuffers.push(buf);
        } catch { /* fallback: skip image for this item */ }
      }

      if (imageBuffers.length > 0) {
        const attachments = imageBuffers.map((buf, i) =>
          new AttachmentBuilder(buf, { name: `dhikr_${i + 1}.png` })
        );
        const embed = buildEmbed('adhkar', {
          title,
          description: items.map((a, i) => `**${i + 1}.** ${a.text} — (${a.count})`).join('\n\n'),
        });
        await channel.send({ embeds: [embed], files: attachments });
      } else {
        const embed = buildEmbed('adhkar', {
          title,
          description: items.map(a => `**${a.text}**\n(${a.count}) ${a.blessing}`).join('\n\n'),
        });
        await channel.send({ embeds: [embed] });
      }
    } catch (e) {
      console.error(`فشل إرسال الأذكار للقناة ${setting.adhkarChannel}`);
    }
  }
}

async function sendDailyAyah(client: Client) {
  const settings = await prisma.guildSetting.findMany({
    where: { announcementChan: { not: null } },
  });

  const randomSurah = Math.floor(Math.random() * 114) + 1;
  const randomAyah = Math.floor(Math.random() * 7) + 1;

  try {
    const verse = await fetchQuranVerse(randomSurah, randomAyah);

    for (const setting of settings) {
      if (!setting.announcementChan) continue;
      try {
        const channel = client.channels.cache.get(setting.announcementChan) as TextChannel;
        if (!channel) continue;

        const embed = buildEmbed('quran', {
          title: 'آية اليوم',
          description: verse.text,
          fields: [
            { name: 'السورة', value: `${verse.surah.englishName} (${verse.surah.name})`, inline: true },
            { name: 'الآية', value: `(${verse.surah.number}:${verse.numberInSurah})`, inline: true },
          ],
        });

        await channel.send({ embeds: [embed] });
      } catch (e) { /* ignore */ }
    }
  } catch (e) {
    console.error('فشل جلب آية اليوم');
  }
}

async function sendDailyHadith(client: Client) {
  const settings = await prisma.guildSetting.findMany({
    where: { announcementChan: { not: null } },
  });

  try {
    const res = await fetch('https://hadith.gading.dev/books/bukhari/random');
    const data: any = await res.json();

    for (const setting of settings) {
      if (!setting.announcementChan) continue;
      try {
        const channel = client.channels.cache.get(setting.announcementChan) as TextChannel;
        if (!channel) continue;

        const embed = buildEmbed('hadith', {
          title: 'حديث اليوم',
          description: data.data?.contents?.ar || 'عَنْ عَائِشَةَ رَضِيَ اللَّهُ عَنْهَا قَالَتْ: كَانَ خُلُقُ نَبِيِّ اللَّهِ ﷺ الْقُرْآنَ',
          fields: [
            { name: 'المصدر', value: data.data?.book?.name || 'صحيح البخاري', inline: true },
          ],
        });

        await channel.send({ embeds: [embed] });
      } catch (e) { /* ignore */ }
    }
  } catch (e) {
    console.error('فشل جلب حديث اليوم');
  }
}
