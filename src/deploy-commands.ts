import { REST, Routes } from 'discord.js';
import { config } from './config';
import { loadCommands } from './handlers/commandHandler';

(async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);

    await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
    console.log('✅ تم مسح الأوامر العالمية');

    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: [] });
      console.log('✅ تم مسح أوامر السيرفر');
    }

    const commands = await loadCommands();
    const commandData = commands.map(c => c.data.toJSON());
    console.log(`تسجيل ${commandData.length} أمر...`);

    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId || ''), {
      body: commandData,
    });
    console.log('✅ تم تسجيل الأوامر في السيرفر');
  } catch (error) {
    console.error('❌ فشل تسجيل الأوامر:', error);
  }
})();
