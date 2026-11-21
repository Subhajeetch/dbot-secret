import { AttachmentBuilder, EmbedBuilder, Message } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { imageService } from "../../../services/image.service";
import { errorEmbed } from "../../../utils/embeds";

export const colorCommand: PrefixCommand = {
  name: "color",
  description: "Generates a Discord-themed preview card with a given hex color",
  category: "utility",
  async execute(message, args) {
    try {
      let color = args[0] || "#ffffff";

      if (!color.startsWith("#") && /^[0-9A-Fa-f]{3,6}$/.test(color)) {
        color = "#" + color;
      }

      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(color)) {
        const invalidColorEmbed = errorEmbed(
          "Please provide a valid hex color code (e.g., #FF0000 or #F00)"
        );
        return await message.reply({ embeds: [invalidColorEmbed] });
      }

      const generatingEmbed = new EmbedBuilder()
        .setColor(2368553)
        .setDescription("Generating your color image...");

      const generatingMessage = await message.reply({
        embeds: [generatingEmbed]
      });

      try {
        const imageBuffer = await imageService.generateColorCard(message.author, color);
        const attachment = new AttachmentBuilder(imageBuffer, {
          name: "color-image.png"
        });

        const finalEmbed = new EmbedBuilder()
          .setColor(2368553)
          .setDescription(`Color preview for \`${color.toUpperCase()}\``)
          .setImage("attachment://color-image.png");

        await generatingMessage.edit({
          embeds: [finalEmbed],
          files: [attachment]
        });
      } catch (imageError) {
        console.error("Error generating the color image:", imageError);
        const wentWrongEmbed = errorEmbed(
          "Something went wrong while generating the image."
        );
        await generatingMessage.edit({ embeds: [wentWrongEmbed] });
      }
    } catch (error) {
      console.error("Error in color command:", error);
      const unableToGenerateEmbed = errorEmbed(
        "Unable to generate the color image. Please try again."
      );
      await message.reply({ embeds: [unableToGenerateEmbed] });
    }
  }
};

export default colorCommand;
