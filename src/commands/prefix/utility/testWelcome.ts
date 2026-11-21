import { Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { settingsService } from "../../../services/settings.service";
import { getRandomWelcomeMessage } from "../../../config/welcomeMessages";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const testWelcomeCommand: PrefixCommand = {
  name: "testwelcome",
  aliases: ["tw", "test-welcome"],
  description: "Tests the welcome reply in the configured main chat channel",
  category: "utility",
  userPermissions: [PermissionFlagsBits.ManageGuild],
  async execute(message) {
    if (!message.guild || !message.member) return;

    const settings = settingsService.getSettings(message.guild.id);
    if (!settings.mainChannelId) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Main chat channel is not configured yet. Run /setup to select a main chat channel.",
            "Setup Required"
          )
        ]
      });
    }

    const channel = message.guild.channels.cache.get(settings.mainChannelId) ||
      (await message.guild.channels.fetch(settings.mainChannelId).catch(() => null));

    if (!channel || !(channel instanceof TextChannel)) {
      return message.reply({
        embeds: [
          errorEmbed(
            `Configured main channel (<#${settings.mainChannelId}>) could not be found or is not a text channel.`,
            "Channel Not Found"
          )
        ]
      });
    }

    const randomMessage = getRandomWelcomeMessage(message.author.id);
    await channel.send({
      content: randomMessage,
      allowedMentions: { users: [message.author.id] }
    });

    return message.reply({
      embeds: [
        successEmbed(
          `Test welcome message sent to <#${settings.mainChannelId}>:\n> ${randomMessage}`,
          "Test Sent"
        )
      ]
    });
  }
};

export default testWelcomeCommand;
