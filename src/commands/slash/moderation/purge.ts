import {
  ChatInputCommandInteraction,
  Collection,
  Message,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel
} from "discord.js";
import { SlashCommand } from "../../../core/types";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const purgeSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk deletes messages from the channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Only delete messages from this user")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        embeds: [errorEmbed("You do not have permission to manage messages.")],
        ephemeral: true
      });
    }

    const botMember = interaction.guild.members.me;
    if (!botMember?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        embeds: [errorEmbed("I do not have permission to manage messages.")],
        ephemeral: true
      });
    }

    if (!interaction.channel || !("bulkDelete" in interaction.channel)) {
      return interaction.reply({
        embeds: [errorEmbed("Messages cannot be bulk deleted in this channel.")],
        ephemeral: true
      });
    }

    const channel = interaction.channel as TextChannel;
    const amount = interaction.options.getInteger("amount", true);
    const targetUser = interaction.options.getUser("user");

    await interaction.deferReply({ ephemeral: true });

    try {
      let messagesToDelete: Collection<string, Message> | Message[];

      if (targetUser) {
        const fetchedMessages = await channel.messages.fetch({ limit: 100 });
        const userMessages = fetchedMessages.filter(msg => msg.author.id === targetUser.id);
        messagesToDelete = Array.from(userMessages.values()).slice(0, amount);
      } else {
        messagesToDelete = await channel.messages.fetch({ limit: amount });
      }

      const count = Array.isArray(messagesToDelete) ? messagesToDelete.length : messagesToDelete.size;
      if (count === 0) {
        return interaction.editReply({
          embeds: [errorEmbed("No eligible messages found to delete.")]
        });
      }

      const deleted = await channel.bulkDelete(messagesToDelete, true);

      const targetInfo = targetUser ? ` from ${targetUser.username}` : "";
      return interaction.editReply({
        embeds: [
          successEmbed(`Successfully purged ${deleted.size} message(s)${targetInfo}.`, "Purged")
        ]
      });
    } catch (error) {
      console.error("Error executing /purge:", error);
      return interaction.editReply({
        embeds: [
          errorEmbed(
            "An error occurred while purging messages. Messages older than 14 days cannot be deleted."
          )
        ]
      });
    }
  }
};

export default purgeSlashCommand;
