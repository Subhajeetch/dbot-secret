import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { SlashCommand } from "../../../core/types";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const banSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to ban")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for banning the user")
        .setMaxLength(512)
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName("delete_messages")
        .setDescription("Delete message history from this user")
        .setRequired(false)
        .addChoices(
          { name: "Don't delete any", value: 0 },
          { name: "Previous 1 hour", value: 3600 },
          { name: "Previous 6 hours", value: 21600 },
          { name: "Previous 12 hours", value: 43200 },
          { name: "Previous 24 hours", value: 86400 },
          { name: "Previous 3 days", value: 259200 },
          { name: "Previous 7 days", value: 604800 }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        embeds: [errorEmbed("You do not have permission to ban members.")],
        ephemeral: true
      });
    }

    const botMember = interaction.guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        embeds: [errorEmbed("I do not have permission to ban members.")],
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";
    const deleteMessageSeconds = interaction.options.getInteger("delete_messages") ?? 0;

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed("You cannot ban yourself.")],
        ephemeral: true
      });
    }

    if (targetUser.id === interaction.client.user.id) {
      return interaction.reply({
        embeds: [errorEmbed("You cannot ban me.")],
        ephemeral: true
      });
    }

    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.reply({
        embeds: [errorEmbed("You cannot ban the server owner.")],
        ephemeral: true
      });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (targetMember) {
      const executorMember = await interaction.guild.members.fetch(interaction.user.id);
      if (
        interaction.user.id !== interaction.guild.ownerId &&
        executorMember.roles.highest.position <= targetMember.roles.highest.position
      ) {
        return interaction.reply({
          embeds: [errorEmbed("You cannot ban a member with an equal or higher role than yours.")],
          ephemeral: true
        });
      }

      if (!targetMember.bannable) {
        return interaction.reply({
          embeds: [errorEmbed("I cannot ban this user due to role hierarchy.")],
          ephemeral: true
        });
      }
    }

    try {
      await interaction.guild.bans.create(targetUser.id, {
        reason: `${interaction.user.tag}: ${reason}`,
        deleteMessageSeconds
      });

      const description =
        reason !== "No reason provided"
          ? `Successfully banned ${targetUser.username}.\nReason: ${reason}`
          : `Successfully banned ${targetUser.username}.`;

      return interaction.reply({
        embeds: [successEmbed(description, "Banned")]
      });
    } catch (error) {
      console.error("Error executing /ban:", error);
      return interaction.reply({
        embeds: [errorEmbed("An error occurred while trying to ban the user.")],
        ephemeral: true
      });
    }
  }
};

export default banSlashCommand;
