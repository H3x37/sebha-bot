import { REST, Routes, APIApplicationCommand } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN || '');
  const guildId = process.env.GUILD_ID || '';

  const globalCmds = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID || '')) as APIApplicationCommand[];
  console.log(`أوامر عالمية: ${globalCmds.length}`);
  globalCmds.forEach((c: APIApplicationCommand) => console.log(`  /${c.name}`));

  if (guildId) {
    const guildCmds = await rest.get(Routes.applicationGuildCommands(process.env.CLIENT_ID || '', guildId)) as APIApplicationCommand[];
    console.log(`\nأوامر السيرفر: ${guildCmds.length}`);
    guildCmds.forEach((c: APIApplicationCommand) => console.log(`  /${c.name}`));
  }
})();
