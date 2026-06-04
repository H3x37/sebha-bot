import { REST, Routes } from 'discord.js';
import { config } from './config';
import { loadCommands } from './handlers/commandHandler';

(async () => {
  try {
    const commands = await loadCommands();
    const commandData = commands.map(c => c.data.toJSON());

    console.log(`تسجيل ${commandData.length} أمر...`);

    const rest = new REST({ version: '10' }).setToken(config.token);

    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: commandData,
      });
      console.log('تم تسجيل الأوامر في السيرفر المحدد');
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), {
        body: commandData,
      });
      console.log('تم تسجيل الأوامر عالمياً');
    }
  } catch (error) {
    console.error(error);
  }
})();
