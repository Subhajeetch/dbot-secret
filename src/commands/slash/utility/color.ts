import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder
} from "discord.js";
import { SlashCommand } from "../../../core/types";
import { imageService } from "../../../services/image.service";
import { errorEmbed } from "../../../utils/embeds";

export const colorSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("color")
    .setDescription("Generates a Discord-themed preview card with a given hex color")
    .addStringOption(option =>
      option
        .setName("hex")
        .setDescription("Hex color code (e.g. #FF5733 or FF5733)")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      let color = interaction.options.getString("hex", true).trim();

      if (!color.startsWith("#") && /^[0-9A-Fa-f]{3,6}$/.test(color)) {
        color = "#" + color;
      }

      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(color)) {
        return interaction.reply({
          embeds: [errorEmbed("Please provide a valid hex color code (e.g., #FF5733 or #F00).")],
          ephemeral: true
        });
      }

      await interaction.deferReply();

      try {
        const imageBuffer = await imageService.generateColorCard(interaction.user, color);
        const attachment = new AttachmentBuilder(imageBuffer, {
          name: "color-preview.png"
        });

        const finalEmbed = new EmbedBuilder()
          .setColor(2368553)
          .setDescription(`Color preview for \`${color.toUpperCase()}\``)
          .setImage("attachment://color-preview.png");

        await interaction.editReply({
          embeds: [finalEmbed],
          files: [attachment]
        });
      } catch (imageError) {
        console.error("Error generating the color image:", imageError);
        await interaction.editReply({
          embeds: [errorEmbed("Something went wrong while generating the color image.")]
        });
      }
    } catch (error) {
      console.error("Error in /color command:", error);
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          embeds: [errorEmbed("Unable to generate the color image. Please try again.")]
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          embeds: [errorEmbed("Unable to generate the color image. Please try again.")],
          ephemeral: true
        });
      }
    }
  }
};

export default colorSlashCommand;
