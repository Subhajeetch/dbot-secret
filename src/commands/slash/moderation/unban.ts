import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder
} from "discord.js";
import { SlashCommand } from "../../../core/types";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const unbanSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unbans a user from the server by user ID")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addStringOption(option =>
      option
        .setName("user_id")
        .setDescription("The ID of the user to unban")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for unbanning the user")
        .setMaxLength(512)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        embeds: [errorEmbed("You do not have permission to unban members.")],
        ephemeral: true
      });
    }

    const botMember = interaction.guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        embeds: [errorEmbed("I do not have permission to unban members.")],
        ephemeral: true
      });
    }

    const rawId = interaction.options.getString("user_id", true);
    const userId = rawId.replace(/[<@!>]/g, "").trim();
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.reply({
        embeds: [errorEmbed("Please provide a valid Discord user ID.")],
        ephemeral: true
      });
    }

    try {
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!ban) {
        return interaction.reply({
          embeds: [errorEmbed("User was not found in the server ban list.")],
          ephemeral: true
        });
      }

      await interaction.guild.members.unban(userId, `${interaction.user.tag}: ${reason}`);

      const userName = ban.user?.username || userId;
      return interaction.reply({
        embeds: [successEmbed(`Successfully unbanned ${userName}.`, "Unbanned")]
      });
    } catch (error) {
      console.error("Error executing /unban:", error);
      return interaction.reply({
        embeds: [errorEmbed("An error occurred while trying to unban the user.")],
        ephemeral: true
      });
    }
  }
};

export default unbanSlashCommand;
