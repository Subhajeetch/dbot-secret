import { Events, GuildMember, TextChannel } from "discord.js";
import { BotEvent } from "../../core/types";
import { settingsService } from "../../services/settings.service";
import { getRandomWelcomeMessage } from "../../config/welcomeMessages";

export async function sendOnboardingDm(
  member: GuildMember,
  mainChannelId: string,
): Promise<boolean> {
  try {
    const serverName = member.guild?.name || "the server";
    const content = `Thanks for joining **${serverName}**. Dont hasitate to chat here: <#${mainChannelId}>. we don't bite dw :)`;
    await member.send({ content });
    return true;
  } catch (error) {
    // Member has DMs disabled or blocked the bot - safely dropped
    return false;
  }
}

export async function sendWelcomeReply(
  member: GuildMember,
  mainChannelId: string,
): Promise<boolean> {
  try {
    const channel =
      member.guild.channels.cache.get(mainChannelId) ||
      (await member.guild.channels.fetch(mainChannelId).catch(() => null));

    if (!channel || !(channel instanceof TextChannel)) {
      return false;
    }

    const message = getRandomWelcomeMessage(member.id);
    await channel.send({
      content: message,
      allowedMentions: { users: [member.id] },
    });
    return true;
  } catch (error) {
    console.error("Error sending welcome reply:", error);
    return false;
  }
}

export const guildMemberAddEvent: BotEvent<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  execute(_client, member: GuildMember) {
    if (member.user.bot || !member.guild) return;

    const settings = settingsService.getSettings(member.guild.id);
    if (!settings.mainChannelId) {
      // Main channel is not configured yet, cannot deliver onboarding or welcome
      return;
    }

    const mainChannelId = settings.mainChannelId;

    // 1. Welcome Reply in Main Chat (default 7 seconds)
    if (settings.welcomeReplyEnabled) {
      const welcomeDelayMs = (settings.welcomeReplyDelay || 7) * 1000;
      setTimeout(async () => {
        // Re-check member in guild
        if (!member.guild.members.cache.has(member.id)) return;
        await sendWelcomeReply(member, mainChannelId);
      }, welcomeDelayMs);
    }

    // 2. Onboarding DM to Member (default 59 seconds)
    if (settings.onboardingDmEnabled) {
      const dmDelayMs = (settings.onboardingDmDelay || 59) * 1000;
      setTimeout(async () => {
        // Re-check member in guild
        if (!member.guild.members.cache.has(member.id)) return;
        await sendOnboardingDm(member, mainChannelId);
      }, dmDelayMs);
    }
  },
};

export default guildMemberAddEvent;
