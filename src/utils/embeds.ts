import { EmbedBuilder } from "discord.js";

export const TICK_EMOJI = "<:tick:1310179325152067676>";
export const CROSS_EMOJI = "<:cross:1310179339005988945>";
export const INVISIBLE_COLOR = 2368553; // 0x242429 - Discord seamless borderless color

export function errorEmbed(description: string, title = "Error"): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(INVISIBLE_COLOR)
    .setTitle(`${CROSS_EMOJI}  ${title}`)
    .setDescription(description);
}

export function successEmbed(description: string, title = "Success"): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(INVISIBLE_COLOR)
    .setTitle(`${TICK_EMOJI}  ${title}`)
    .setDescription(description);
}

export function avatarEmbed(avatarUrl: string): EmbedBuilder {
  return new EmbedBuilder().setColor(INVISIBLE_COLOR).setImage(avatarUrl);
}
