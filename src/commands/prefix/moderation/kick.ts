import { EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { settingsService } from "../../../services/settings.service";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const kickCommand: PrefixCommand = {
  name: "kick",
  aliases: ["k"],
  description: "Kicks a member from the server",
  category: "moderation",
  userPermissions: [PermissionFlagsBits.KickMembers],
  async execute(message, args) {
    try {
      if (!message.member || !message.guild) return;

      const mentionedUser = message.mentions.members?.first();
      const prefix = settingsService.getPrefix(message.guild.id);

      const sendKickGuide = () => {
        const kickGuideEmbed = new EmbedBuilder()
          .setColor(2368553)
          .setTitle("Kick Guide")
          .setDescription(
            `**Usage:**\n${prefix}k @user\n${prefix}k @user reason\n${prefix}kick @user reason\n\n**Examples:**\n${prefix}kick @user Spamming\n${prefix}k @user Rule violations`
          )
          .setFooter({ text: "Mention a user to kick them." });
        return message.reply({ embeds: [kickGuideEmbed] });
      };

      if (!args[0] || !/^<@!?\d+>$/.test(args[0]) || !mentionedUser) {
        return await sendKickGuide();
      }

      if (mentionedUser.id === message.author.id) {
        return await message.reply({
          embeds: [errorEmbed("You cannot kick yourself.")]
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
              "You cannot kick a member with an equal or higher role than yours."
            )
          ]
        });
      }

      if (!mentionedUser.kickable) {
        return await message.reply({
          embeds: [errorEmbed("User cannot be kicked due to role hierarchy.")]
        });
      }

      const reason = args.slice(1).join(" ") || "No reason provided";
      await mentionedUser.kick(reason);

      const description =
        reason !== "No reason provided"
          ? `Successfully kicked <@${mentionedUser.user.id}>.\nReason: ${reason}.`
          : `Successfully kicked <@${mentionedUser.user.id}>.`;

      await message.reply({ embeds: [successEmbed(description, "Kicked")] });
    } catch (error) {
      console.error("Error in kick command:", error);
      const errorKickEmbed = errorEmbed(
        "An error occurred while trying to kick the user."
      );
      await message.reply({ embeds: [errorKickEmbed] });
    }
  }
};

export default kickCommand;
