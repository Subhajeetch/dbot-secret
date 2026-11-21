import { EmbedBuilder, Message, PermissionFlagsBits } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { settingsService } from "../../../services/settings.service";
import { INVISIBLE_COLOR, successEmbed } from "../../../utils/embeds";

export const testMentionCommand: PrefixCommand = {
  name: "testmention",
  aliases: ["tm", "test-mention"],
  description: "Simulates and tests the bot mention reply in the server",
  category: "utility",
  userPermissions: [PermissionFlagsBits.ManageGuild],
  async execute(message) {
    if (!message.guild || !message.member) return;

    const settings = settingsService.getSettings(message.guild.id);
    const replyText = settingsService.getMentionReply(message.guild.id);

    const embed = new EmbedBuilder()
      .setColor(INVISIBLE_COLOR)
      .setDescription(replyText);

    const statusText = settings.mentionReplyEnabled
      ? "Enabled"
      : "Disabled (Bot will not respond to mentions until enabled in /setup)";

    await message.reply({
      content: `**[Mention Reply Test • Status: ${statusText}]**`,
      embeds: [embed]
    });
  }
};

export default testMentionCommand;
