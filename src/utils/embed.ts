import { EmbedBuilder } from 'discord.js';
import { config, colors, icons } from '../config';

type Section = keyof typeof colors;

interface EmbedOptions {
  author?: string;
  title?: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  image?: string;
  thumbnail?: string;
  footer?: string;
}

export function buildEmbed(section: Section, options: EmbedOptions) {
  const color = colors[section] || colors.default;
  const icon = icons[section] || icons.default;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTimestamp(new Date());

  if (options.author) {
    embed.setAuthor({ name: `${icon} ${options.author}` });
  }

  if (options.title) {
    embed.setTitle(`**${options.title}**`);
  }

  if (options.description) {
    embed.setDescription(options.description);
  }

  if (options.fields) {
    embed.addFields(options.fields.map(f => ({
      name: f.name,
      value: f.value,
      inline: f.inline ?? false,
    })));
  }

  if (options.image) embed.setImage(options.image);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);

  const footerPrefix = config.monoIcon ? `${config.monoIcon} ` : '';
  const footerText = options.footer
    ? `${options.footer} • ${config.footer}`
    : `${footerPrefix}${config.footer}`;

  embed.setFooter({ text: footerText });

  return embed;
}

export function errorEmbed(message: string) {
  return new EmbedBuilder()
    .setColor(0xB71C1C)
    .setTitle('**خطأ**')
    .setDescription(message)
    .setFooter({ text: config.footer })
    .setTimestamp(new Date());
}
