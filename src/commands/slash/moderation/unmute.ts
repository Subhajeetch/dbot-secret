import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { SlashCommand } from "../../../core/types";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const unmuteSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Removes timeout from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The member to unmute")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for unmuting")
        .setMaxLength(512)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
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
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed("You cannot unmute yourself.")],
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
        embeds: [errorEmbed("You cannot unmute a member with an equal or higher role than yours.")],
        ephemeral: true
      });
    }

    if (!targetMember.isCommunicationDisabled()) {
      return interaction.reply({
        embeds: [errorEmbed("This user is not currently muted.")],
        ephemeral: true
      });
    }

    if (!targetMember.moderatable) {
      return interaction.reply({
        embeds: [errorEmbed("I cannot unmute this member due to role hierarchy.")],
        ephemeral: true
      });
    }

    try {
      await targetMember.timeout(null, `${interaction.user.tag}: ${reason}`);

      return interaction.reply({
        embeds: [successEmbed(`Successfully unmuted ${targetUser.username}.`, "Unmuted")]
      });
    } catch (error) {
      console.error("Error executing /unmute:", error);
      return interaction.reply({
        embeds: [errorEmbed("An error occurred while trying to unmute the member.")],
        ephemeral: true
      });
    }
  }
};

export default unmuteSlashCommand;
