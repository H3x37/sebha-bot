import { REST, Routes } from 'discord.js';
import { config } from './config';
import { loadCommands } from './handlers/commandHandler';

(async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);

    const commands = await loadCommands();
    const commandData = commands.map(c => c.data.toJSON());
    console.log(`تسجيل ${commandData.length} أمر...`);

    // 1. تسجيل عالمي أولاً (عشان ما تختفي الأوامر لحين النشر)
    await rest.put(Routes.applicationCommands(config.clientId), {
      body: commandData,
    });
    console.log('✅ تم تسجيل الأوامر عالمياً');

    // 2. مسح أوامر السيرفر بعدها (عشان لا تظهر مكررة)
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: [] });
      console.log('✅ تم مسح أوامر السيرفر');
    }
  } catch (error) {
    console.error('❌ فشل تسجيل الأوامر:', error);
  }
})();
