import { EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { settingsService } from "../../../services/settings.service";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const unmuteCommand: PrefixCommand = {
  name: "unmute",
  aliases: ["um"],
  description: "Removes timeout from a member",
  category: "moderation",
  userPermissions: [PermissionFlagsBits.ModerateMembers],
  async execute(message, args) {
    try {
      if (!message.member || !message.guild) return;

      const mentionedUser = message.mentions.members?.first();
      const prefix = settingsService.getPrefix(message.guild.id);

      const sendUnmuteGuide = () => {
        const unmuteGuideEmbed = new EmbedBuilder()
          .setColor(2368553)
          .setTitle("Unmute Guide")
          .setDescription(
            `**Usage:**\n${prefix}unmute @user\n${prefix}um @user`
          )
          .setFooter({ text: "Mention a user to unmute them." });
        return message.reply({ embeds: [unmuteGuideEmbed] });
      };

      if (args.length !== 1 || !/^<@!?\d+>$/.test(args[0]) || !mentionedUser) {
        return await sendUnmuteGuide();
      }

      if (
        message.author.id !== message.guild.ownerId &&
        message.member.roles.highest.position <=
          mentionedUser.roles.highest.position
      ) {
        return await message.reply({
          embeds: [
            errorEmbed(
              "You cannot unmute a member with an equal or higher role than yours."
            )
          ]
        });
      }

      if (!mentionedUser.isCommunicationDisabled()) {
        const notMutedEmbed = errorEmbed("This user is not muted.");
        return await message.reply({ embeds: [notMutedEmbed] });
      }

      if (!mentionedUser.moderatable) {
        const cantUnmuteEmbed = errorEmbed(
          "I cannot unmute this user due to role hierarchy."
        );
        return await message.reply({ embeds: [cantUnmuteEmbed] });
      }

      await mentionedUser.timeout(null);

      const successUnmuteEmbed = successEmbed(
        `Successfully unmuted <@${mentionedUser.user.id}>.`,
        "Unmuted"
      );
      await message.reply({ embeds: [successUnmuteEmbed] });
    } catch (error) {
      console.error("Error in unmute command:", error);
      const errorUnmuteEmbed = errorEmbed(
        "An error occurred while trying to unmute the user."
      );
      await message.reply({ embeds: [errorUnmuteEmbed] });
    }
  }
};

export default unmuteCommand;
