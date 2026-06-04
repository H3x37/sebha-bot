import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import { config } from './config';
import { loadCommands } from './handlers/commandHandler';
import { startScheduledTasks } from './scheduler';
import { startApi } from './api/server';
import prisma from './utils/prisma';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once(Events.ClientReady, async () => {
  console.log(`${config.botName} متصل كـ ${client.user?.tag}`);

  client.commands = await loadCommands();
  startScheduledTasks(client);
  startApi();
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands?.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      content: `❌ الأمر \`/${interaction.commandName}\` غير موجود`,
      flags: 64,
    }).catch(() => {});
    return;
  }

  try {
    const result = command.execute(interaction);
    if (result instanceof Promise) {
      await result;
    }
  } catch (error) {
    console.error(`❌ خطأ في أمر /${interaction.commandName}:`, error);
    const reply = { content: '❌ حدث خطأ أثناء تنفيذ الأمر', flags: 64 };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, any>;
  }
}

client.login(config.token);

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
