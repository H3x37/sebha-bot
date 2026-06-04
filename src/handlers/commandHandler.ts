import { Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { Command } from '../types';

const commands = new Collection<string, Command>();

export async function loadCommands(): Promise<Collection<string, Command>> {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter(f => (f.endsWith('.ts') || f.endsWith('.js')) && !f.endsWith('.d.ts'));
    for (const file of files) {
      try {
        const filePath = path.join(categoryPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        const mod = await import(fileUrl);
        const command: Command = mod.default;
        if (command?.data?.name) {
          commands.set(command.data.name, command);
          console.log(`✅ تم تحميل: ${command.data.name}`);
        }
      } catch (err) {
        console.error(`❌ فشل تحميل ${file}:`, err);
      }
    }
  }

  console.log(`✅ تم تحميل ${commands.size} أمر`);
  return commands;
}

export function getCommands(): Collection<string, Command> {
  return commands;
}
