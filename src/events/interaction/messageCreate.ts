import { Events, Message, EmbedBuilder } from "discord.js";
import { BotEvent } from "../../core/types";
import { settingsService } from "../../services/settings.service";
import { afkService } from "../../services/afk.service";
import { errorEmbed, INVISIBLE_COLOR } from "../../utils/embeds";

export const messageCreateEvent: BotEvent<Events.MessageCreate> = {
  name: Events.MessageCreate,
  async execute(client, message: Message) {
    if (message.author.bot || !message.guild) return;

    try {
      const settings = settingsService.getSettings(message.guild.id);
      const prefix = settingsService.getPrefix(message.guild.id);

      const isAfkCmd =
        message.content === `${prefix}afk` ||
        message.content.startsWith(`${prefix}afk `);

      // Check if message author mentioned any AFK user
      afkService.checkMentionedAfk(message);

      // If author was AFK, welcome them back unless they are setting AFK
      if (!isAfkCmd) {
        await afkService.checkAfkReturn(message);
      }

      // Check if bot was directly mentioned (and not executing a prefix command)
      const isBotMentioned =
        !!client.user &&
        message.mentions.users.has(client.user.id) &&
        (message.content.includes(`<@${client.user.id}>`) ||
          message.content.includes(`<@!${client.user.id}>`));

      if (isBotMentioned && !message.content.startsWith(prefix)) {
        if (settings.mentionReplyEnabled) {
          const replyText = settingsService.getMentionReply(message.guild.id);
          const replyEmbed = new EmbedBuilder()
            .setColor(INVISIBLE_COLOR)
            .setDescription(replyText);
          await message.reply({ embeds: [replyEmbed] });
          return;
        }
      }

      // If message doesn't start with prefix, ignore
      if (!message.content.startsWith(prefix)) return;

      const args = message.content.slice(prefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();
      if (!commandName) return;

      // Match command by name or alias
      const command = client.getPrefixCommand(commandName);
      if (!command) return;

      // Check user permissions if specified
      if (command.userPermissions && message.member) {
        const missing = command.userPermissions.filter(
          perm => !message.member?.permissions.has(perm)
        );
        if (missing.length > 0) {
          const noPermEmbed = errorEmbed(
            "You do not have permission to execute this command.",
            "Permission Denied"
          );
          await message.reply({ embeds: [noPermEmbed] });
          return;
        }
      }

      // Execute command
      await command.execute(message, args, client);
    } catch (err) {
      console.error("Unhandled error in messageCreate event:", err);
    }
  }
};

export default messageCreateEvent;
