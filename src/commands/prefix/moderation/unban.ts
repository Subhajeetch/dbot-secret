import { EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { settingsService } from "../../../services/settings.service";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const unbanCommand: PrefixCommand = {
  name: "unban",
  aliases: ["ub"],
  description: "Unbans a user from the server by user ID or mention",
  category: "moderation",
  userPermissions: [PermissionFlagsBits.BanMembers],
  async execute(message, args) {
    try {
      if (!message.member || !message.guild) return;

      const prefix = settingsService.getPrefix(message.guild.id);

      const sendUnbanGuide = () => {
        const unbanGuideEmbed = new EmbedBuilder()
          .setColor(2368553)
          .setTitle("Unban Guide")
          .setDescription(
            `**Usage:**\n${prefix}unban @user or userID\n${prefix}ub @user or userID\n\n**Examples:**\n${prefix}ub @user\n${prefix}unban @user\n${prefix}ub 5887437874478854`
          )
          .setFooter({
            text: "Provide a user ID or mention a user to unban them."
          });
        return message.reply({ embeds: [unbanGuideEmbed] });
      };

      if (!args[0]) {
        return await sendUnbanGuide();
      }

      const userId = args[0].replace(/[<@!>]/g, "");
      if (!/^\d+$/.test(userId)) {
        return await sendUnbanGuide();
      }

      const banList = await message.guild.bans.fetch();
      const bannedUser = banList.get(userId);

      if (!bannedUser) {
        return await message.reply({
          embeds: [errorEmbed("User was not found in the ban list.", "Not Found")]
        });
      }

      await message.guild.members.unban(userId);

      await message.reply({
        embeds: [successEmbed(`Successfully unbanned <@${userId}>.`, "Unbanned")]
      });
    } catch (error) {
      console.error("Error in unban command:", error);
      const errorUnbanEmbed = errorEmbed(
        "An error occurred while trying to unban the user."
      );
      await message.reply({ embeds: [errorUnbanEmbed] });
    }
  }
};

export default unbanCommand;
