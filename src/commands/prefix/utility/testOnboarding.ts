import { Message, PermissionFlagsBits } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { settingsService } from "../../../services/settings.service";
import { sendOnboardingDm } from "../../../events/guild/guildMemberAdd";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const testOnboardingCommand: PrefixCommand = {
  name: "testonboarding",
  aliases: ["tod", "test-onboarding", "testdm"],
  description: "Tests sending the onboarding DM to your private messages",
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

    const delivered = await sendOnboardingDm(message.member, settings.mainChannelId);

    if (delivered) {
      return message.reply({
        embeds: [
          successEmbed(
            `Onboarding DM successfully delivered to your private messages.\nChannel linked: <#${settings.mainChannelId}>`,
            "DM Delivered"
          )
        ]
      });
    } else {
      return message.reply({
        embeds: [
          errorEmbed(
            "Unable to deliver onboarding DM. Your direct messages for this server may be disabled or blocked.",
            "Delivery Failed"
          )
        ]
      });
    }
  }
};

export default testOnboardingCommand;
