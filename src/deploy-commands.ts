import { REST, Routes } from 'discord.js';
import { config } from './config';
import { loadCommands } from './handlers/commandHandler';

(async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);

    const commands = await loadCommands();
    const commandData = commands.map(c => c.data.toJSON());
    console.log(`تسجيل ${commandData.length} أمر...`);

    // 1. تسجيل عالمي — يشتغل في كل السيرفرات (يحتاج وقت لنشر)
    await rest.put(Routes.applicationCommands(config.clientId), {
      body: commandData,
    });
    console.log('✅ تم تسجيل الأوامر عالمياً (قد يلزم ساعة للظهور)');

    // 2. تسجيل في السيرفر الرئيسي — يظهر فوراً (اختياري)
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: commandData,
      });
      console.log('✅ تم تسجيل الأوامر في السيرفر الرئيسي (ظهور فوري)');
    }
  } catch (error) {
    console.error('❌ فشل تسجيل الأوامر:', error);
  }
})();
