import { EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { settingsService } from "../../../services/settings.service";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const timeoutCommand: PrefixCommand = {
  name: "timeout",
  aliases: ["m", "mute"],
  description: "Times out / mutes a member for a specified duration",
  category: "moderation",
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args) {
    try {
      if (!message.member || !message.guild) return;

      const mentionedUser = message.mentions.members?.first();
      const prefix = settingsService.getPrefix(message.guild.id);

      const sendMuteGuide = () => {
        const muteGuideEmbed = new EmbedBuilder()
          .setColor(2368553)
          .setTitle("Mute Guide")
          .setDescription(
            `**Usage:**\n${prefix}mute @user [duration] [reason]\n${prefix}m @user [duration] [reason]\n\n**Examples:**\n${prefix}m @user\n${prefix}mute @user 30s Spamming\n${prefix}m @user 1h Inappropriate behavior\n\n**Duration format:**\ns - seconds | m - minutes | h - hours | d - days\n\nDefault duration is 5 minutes if not specified.\nMinimum duration: 10 seconds | Maximum duration: 14 days`
          )
          .setFooter({ text: "Mention a user to mute them." });
        return message.reply({ embeds: [muteGuideEmbed] });
      };

      if (!args[0] || !/^<@!?\d+>$/.test(args[0]) || !mentionedUser) {
        return await sendMuteGuide();
      }

      if (mentionedUser.id === message.author.id) {
        return await message.reply({
          embeds: [errorEmbed("You cannot mute yourself.")]
        });
      }

      if (
        message.author.id !== message.guild.ownerId &&
        message.member.roles.highest.position <=
          mentionedUser.roles.highest.position
      ) {
        return await message.reply({
          embeds: [
            errorEmbed(
              "You cannot mute a member with an equal or higher role than yours."
            )
          ]
        });
      }

      if (mentionedUser.isCommunicationDisabled()) {
        const alreadyMutedEmbed = errorEmbed("This user is already muted.");
        return await message.reply({ embeds: [alreadyMutedEmbed] });
      }

      if (!mentionedUser.moderatable) {
        return await message.reply({
          embeds: [errorEmbed("User cannot be muted due to role hierarchy.")]
        });
      }

      let duration = 300000; // Default 5 minutes
      let reason = "No reason provided";

      if (args.length >= 2) {
        const timeMatch = args[1].match(/^(\d+)([smhd])$/i);
        if (timeMatch) {
          const time = parseInt(timeMatch[1], 10);
          const unit = timeMatch[2].toLowerCase() as "s" | "m" | "h" | "d";
          const multipliers: Record<"s" | "m" | "h" | "d", number> = {
            s: 1000,
            m: 60000,
            h: 3600000,
            d: 86400000
          };
          duration = time * multipliers[unit];
          reason = args.slice(2).join(" ") || reason;
        } else {
          reason = args.slice(1).join(" ") || reason;
        }
      }

      if (duration < 10000 || duration > 1209600000) {
        const invalidDurationEmbed = errorEmbed(
          "Invalid duration. Duration must be between 10 seconds and 14 days."
        );
        return await message.reply({ embeds: [invalidDurationEmbed] });
      }

      await mentionedUser.timeout(duration, reason);

      let readableDuration: string;
      if (duration < 60000) {
        readableDuration = `${Math.floor(duration / 1000)} second(s)`;
      } else if (duration < 3600000) {
        readableDuration = `${Math.floor(duration / 60000)} minute(s)`;
      } else if (duration < 86400000) {
        readableDuration = `${Math.floor(duration / 3600000)} hour(s)`;
      } else {
        readableDuration = `${Math.floor(duration / 86400000)} day(s)`;
      }

      const description =
        reason !== "No reason provided"
          ? `Successfully muted <@${mentionedUser.user.id}>.\nDuration: ${readableDuration}.\nReason: ${reason}.`
          : `Successfully muted <@${mentionedUser.user.id}>.\nDuration: ${readableDuration}.`;

      await message.reply({ embeds: [successEmbed(description, "Muted")] });
    } catch (error) {
      console.error("Error in timeout command:", error);
      const errorMuteEmbed = errorEmbed(
        "An error occurred while trying to mute the user."
      );
      await message.reply({ embeds: [errorMuteEmbed] });
    }
  }
};

export default timeoutCommand;
