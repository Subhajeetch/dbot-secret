import { Message, PermissionFlagsBits } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { settingsService } from "../../../services/settings.service";
import { sendOnboardingDm, sendWelcomeReply } from "../../../events/guild/guildMemberAdd";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const simulateJoinCommand: PrefixCommand = {
  name: "simulatejoin",
  aliases: ["simjoin", "testjoin"],
  description: "Simulates the full member join flow with configured delays",
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

    const member = message.member;
    const mainChannelId = settings.mainChannelId;
    const welcomeDelay = settings.welcomeReplyEnabled ? settings.welcomeReplyDelay : null;
    const dmDelay = settings.onboardingDmEnabled ? settings.onboardingDmDelay : null;

    let info = `Simulating join sequence for ${member.user.username}:\n`;
    if (welcomeDelay !== null) {
      info += `• Welcome reply scheduled in **${welcomeDelay}s** in <#${mainChannelId}>\n`;
      setTimeout(async () => {
        await sendWelcomeReply(member, mainChannelId);
      }, welcomeDelay * 1000);
    } else {
      info += `• Welcome reply is **disabled**\n`;
    }

    if (dmDelay !== null) {
      info += `• Onboarding DM scheduled in **${dmDelay}s**`;
      setTimeout(async () => {
        const delivered = await sendOnboardingDm(member, mainChannelId);
        if (!delivered) {
          console.warn(`Simulated DM to ${member.user.tag} failed (DMs disabled).`);
        }
      }, dmDelay * 1000);
    } else {
      info += `• Onboarding DM is **disabled**`;
    }

    return message.reply({
      embeds: [successEmbed(info, "Simulation Started")]
    });
  }
};

export default simulateJoinCommand;
