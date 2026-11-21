import {
  ChatInputCommandInteraction,
  ClientEvents,
  Message,
  PermissionResolvable,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from "discord.js";
import { BotClient } from "./client";

export type AnySlashCommandBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

export interface PrefixCommand {
  name: string;
  aliases?: string[];
  description?: string;
  category?: string;
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  execute: (message: Message, args: string[], client: BotClient) => Promise<any> | any;
}

export interface SlashCommand {
  data: AnySlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction, client: BotClient) => Promise<any> | any;
}

export interface BotEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (client: BotClient, ...args: ClientEvents[K]) => Promise<void> | void;
}

export interface AfkEntry {
  timestamp: number;
  reason: string;
}

export type AfkCache = Record<string, AfkEntry>;

export interface LevelUpCardOptions {
  avatarBuffer?: Buffer;
  currentExp: number;
  maxExp: number;
  username: string;
  progress: number;
}
