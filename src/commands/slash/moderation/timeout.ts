import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { SlashCommand } from "../../../core/types";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

function parseDuration(input: string | null): { ms: number; readable: string } | null {
  if (!input) {
    return { ms: 300000, readable: "5 minutes" };
  }

  const match = input.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000
  };

  const ms = value * multipliers[unit];
  if (ms < 10000 || ms > 2419200000) {
    return null;
  }

  const unitNames: Record<string, string> = {
    s: value === 1 ? "second" : "seconds",
    m: value === 1 ? "minute" : "minutes",
    h: value === 1 ? "hour" : "hours",
    d: value === 1 ? "day" : "days"
  };

  return { ms, readable: `${value} ${unitNames[unit]}` };
}

async function handleTimeoutExecution(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.member) return;

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({
      embeds: [errorEmbed("You do not have permission to moderate members.")],
      ephemeral: true
    });
  }

  const botMember = interaction.guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({
      embeds: [errorEmbed("I do not have permission to moderate members.")],
      ephemeral: true
    });
  }

  const targetUser = interaction.options.getUser("user", true);
  const rawDuration = interaction.options.getString("duration");
  const reason = interaction.options.getString("reason") || "No reason provided";

  if (targetUser.id === interaction.user.id) {
    return interaction.reply({
      embeds: [errorEmbed("You cannot mute yourself.")],
      ephemeral: true
    });
  }

  if (targetUser.id === interaction.client.user.id) {
    return interaction.reply({
      embeds: [errorEmbed("You cannot mute me.")],
      ephemeral: true
    });
  }

  if (targetUser.id === interaction.guild.ownerId) {
    return interaction.reply({
      embeds: [errorEmbed("You cannot mute the server owner.")],
      ephemeral: true
    });
  }

  const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
  if (!targetMember) {
    return interaction.reply({
      embeds: [errorEmbed("This user is not a member of this server.")],
      ephemeral: true
    });
  }

  const executorMember = await interaction.guild.members.fetch(interaction.user.id);
  if (
    interaction.user.id !== interaction.guild.ownerId &&
    executorMember.roles.highest.position <= targetMember.roles.highest.position
  ) {
    return interaction.reply({
      embeds: [errorEmbed("You cannot mute a member with an equal or higher role than yours.")],
      ephemeral: true
    });
  }

  if (targetMember.isCommunicationDisabled()) {
    return interaction.reply({
      embeds: [errorEmbed("This user is already muted.")],
      ephemeral: true
    });
  }

  if (!targetMember.moderatable) {
    return interaction.reply({
      embeds: [errorEmbed("I cannot mute this member due to role hierarchy.")],
      ephemeral: true
    });
  }

  const parsedDuration = parseDuration(rawDuration);
  if (!parsedDuration) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Invalid duration. Duration must be between 10 seconds and 28 days (e.g., 30s, 5m, 1h, 7d)."
        )
      ],
      ephemeral: true
    });
  }

  try {
    await targetMember.timeout(parsedDuration.ms, `${interaction.user.tag}: ${reason}`);

    const description =
      reason !== "No reason provided"
        ? `Successfully muted ${targetUser.username}.\nDuration: ${parsedDuration.readable}\nReason: ${reason}`
        : `Successfully muted ${targetUser.username}.\nDuration: ${parsedDuration.readable}`;

    return interaction.reply({
      embeds: [successEmbed(description, "Muted")]
    });
  } catch (error) {
    console.error("Error executing timeout/mute command:", error);
    return interaction.reply({
      embeds: [errorEmbed("An error occurred while trying to mute the member.")],
      ephemeral: true
    });
  }
}

export const timeoutSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Times out / mutes a member for a specified duration")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The member to timeout")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("duration")
        .setDescription("Duration e.g. 30s, 5m, 1h, 1d (defaults to 5 minutes)")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for the timeout")
        .setMaxLength(512)
        .setRequired(false)
    ),
  execute: handleTimeoutExecution
};

export const muteSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mutes / times out a member for a specified duration")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The member to mute")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("duration")
        .setDescription("Duration e.g. 30s, 5m, 1h, 1d (defaults to 5 minutes)")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for muting")
        .setMaxLength(512)
        .setRequired(false)
    ),
  execute: handleTimeoutExecution
};

export default timeoutSlashCommand;
