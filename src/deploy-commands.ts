import { REST, Routes } from 'discord.js';
import { config } from './config';
import { loadCommands } from './handlers/commandHandler';

(async () => {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);

    // فحص الأوامر المسجلة حالياً
    const currentGlobal: any = await rest.get(Routes.applicationCommands(config.clientId));
    console.log(`📋 أوامر عالمية موجودة: ${currentGlobal.length}`);
    currentGlobal.forEach((c: any) => console.log(`   /${c.name}`));

    const currentGuild: any = await rest.get(Routes.applicationGuildCommands(config.clientId, config.guildId || ''));
    console.log(`📋 أوامر السيرفر موجودة: ${currentGuild.length}`);
    currentGuild.forEach((c: any) => console.log(`   /${c.name}`));

    // مسح الكل
    await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
    console.log('✅ تم مسح الأوامر العالمية');

    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: [] });
      console.log('✅ تم مسح أوامر السيرفر');
    }

    // تسجيل 9 أوامر جديدة
    const commands = await loadCommands();
    const commandData = commands.map(c => c.data.toJSON());
    console.log(`تسجيل ${commandData.length} أمر...`);

    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId || ''), {
      body: commandData,
    });
    console.log('✅ تم تسجيل الأوامر في السيرفر');
  } catch (error) {
    console.error('❌ فشل:', error);
  }
})();
