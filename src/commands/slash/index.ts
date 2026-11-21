import pingSlash from "./utility/ping";
import afkSlash from "./utility/afk";
import colorSlash from "./utility/color";
import setupSlash from "./utility/setup";
import banSlash from "./moderation/ban";
import kickSlash from "./moderation/kick";
import { timeoutSlashCommand, muteSlashCommand } from "./moderation/timeout";
import unmuteSlash from "./moderation/unmute";
import unbanSlash from "./moderation/unban";
import purgeSlash from "./moderation/purge";
import avatarSlash from "./fun/avatar";
import levelSlash from "./fun/level";
import { SlashCommand } from "../../core/types";

export const slashCommands: SlashCommand[] = [
  pingSlash,
  afkSlash,
  colorSlash,
  setupSlash,
  banSlash,
  kickSlash,
  timeoutSlashCommand,
  muteSlashCommand,
  unmuteSlash,
  unbanSlash,
  purgeSlash,
  avatarSlash,
  levelSlash
];

export {
  pingSlash,
  afkSlash,
  colorSlash,
  setupSlash,
  banSlash,
  kickSlash,
  timeoutSlashCommand,
  muteSlashCommand,
  unmuteSlash,
  unbanSlash,
  purgeSlash,
  avatarSlash,
  levelSlash
};
