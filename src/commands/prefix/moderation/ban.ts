import { EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { settingsService } from "../../../services/settings.service";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const banCommand: PrefixCommand = {
  name: "ban",
  aliases: ["b"],
  description: "Bans a member from the server",
  category: "moderation",
  userPermissions: [PermissionFlagsBits.BanMembers],
  async execute(message, args) {
    try {
      if (!message.member || !message.guild) return;

      const mentionedUser = message.mentions.members?.first();
      const prefix = settingsService.getPrefix(message.guild.id);

      const sendBanGuide = () => {
        const banGuideEmbed = new EmbedBuilder()
          .setColor(2368553)
          .setTitle("Ban Guide")
          .setDescription(
            `**Usage:**\n${prefix}b @user\n${prefix}b @user reason\n${prefix}ban @user reason\n\n**Examples:**\n${prefix}ban @user Spamming\n${prefix}b @user Rule violations`
          )
          .setFooter({ text: "Mention a user to ban them." });
        return message.reply({ embeds: [banGuideEmbed] });
      };

      if (!args[0] || !/^<@!?\d+>$/.test(args[0]) || !mentionedUser) {
        return await sendBanGuide();
      }

      if (mentionedUser.id === message.author.id) {
        return await message.reply({
          embeds: [errorEmbed("You cannot ban yourself.")]
        });
      }

      // Role hierarchy check
      if (
        message.author.id !== message.guild.ownerId &&
        message.member.roles.highest.position <=
          mentionedUser.roles.highest.position
      ) {
        return await message.reply({
          embeds: [
            errorEmbed(
              "You cannot ban a member with an equal or higher role than yours."
            )
          ]
        });
      }

      if (!mentionedUser.bannable) {
        return await message.reply({
          embeds: [errorEmbed("User cannot be banned due to role hierarchy.")]
        });
      }

      const reason = args.slice(1).join(" ") || "No reason provided";
      await mentionedUser.ban({ reason });

      const description =
        reason !== "No reason provided"
          ? `Successfully banned <@${mentionedUser.user.id}>.\nReason: ${reason}.`
          : `Successfully banned <@${mentionedUser.user.id}>.`;

      await message.reply({ embeds: [successEmbed(description, "Banned")] });
    } catch (error) {
      console.error("Error in ban command:", error);
      const errorBanEmbed = errorEmbed(
        "An error occurred while trying to ban the user."
      );
      await message.reply({ embeds: [errorBanEmbed] });
    }
  }
};

export default banCommand;
