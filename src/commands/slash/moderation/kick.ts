import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { SlashCommand } from "../../../core/types";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const kickSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The member to kick")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for kicking the member")
        .setMaxLength(512)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        embeds: [errorEmbed("You do not have permission to kick members.")],
        ephemeral: true
      });
    }

    const botMember = interaction.guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        embeds: [errorEmbed("I do not have permission to kick members.")],
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed("You cannot kick yourself.")],
        ephemeral: true
      });
    }

    if (targetUser.id === interaction.client.user.id) {
      return interaction.reply({
        embeds: [errorEmbed("You cannot kick me.")],
        ephemeral: true
      });
    }

    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.reply({
        embeds: [errorEmbed("You cannot kick the server owner.")],
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
        embeds: [errorEmbed("You cannot kick a member with an equal or higher role than yours.")],
        ephemeral: true
      });
    }

    if (!targetMember.kickable) {
      return interaction.reply({
        embeds: [errorEmbed("I cannot kick this member due to role hierarchy.")],
        ephemeral: true
      });
    }

    try {
      await targetMember.kick(`${interaction.user.tag}: ${reason}`);

      const description =
        reason !== "No reason provided"
          ? `Successfully kicked ${targetUser.username}.\nReason: ${reason}`
          : `Successfully kicked ${targetUser.username}.`;

      return interaction.reply({
        embeds: [successEmbed(description, "Kicked")]
      });
    } catch (error) {
      console.error("Error executing /kick:", error);
      return interaction.reply({
        embeds: [errorEmbed("An error occurred while trying to kick the member.")],
        ephemeral: true
      });
    }
  }
};

export default kickSlashCommand;
