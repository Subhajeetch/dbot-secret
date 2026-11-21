import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../../../core/types";
import { afkService } from "../../../services/afk.service";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const afkSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set your AFK status with an optional reason")
    .addStringOption(option =>
      option
        .setName("reason")
        .setDescription("Reason for going AFK")
        .setMaxLength(200)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const userId = interaction.user.id;
      const reason = interaction.options.getString("reason")?.trim() || "AFK";

      if (afkService.isAfk(userId)) {
        return interaction.reply({
          embeds: [errorEmbed("You are already AFK.")],
          ephemeral: true
        });
      }

      await afkService.setAfk(userId, reason);

      return interaction.reply({
        embeds: [successEmbed(`Your AFK status is set.\nReason: ${reason}`, "AFK Set")]
      });
    } catch (error) {
      console.error("Error in /afk command:", error);
      return interaction.reply({
        embeds: [errorEmbed("An error occurred while setting AFK.")],
        ephemeral: true
      });
    }
  }
};

export default afkSlashCommand;
