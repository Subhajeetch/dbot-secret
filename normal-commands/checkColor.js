const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const serverPrefix = require("../prifix.js");
const generateColorImage = require("../imagemagick_templates/genColorChecker.js");
const { errorEmbed } = require("../utils/embeds.js");

const colorCommand = async message => {
  const tokens = message.content.trim().split(/\s+/);
  if (tokens[0].toLowerCase() !== `${serverPrefix}color`) return;

  try {
    const args = tokens.slice(1);
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
      .setColor("#FFA500")
      .setDescription(
        "<a:loading:1310179353165959198>   **Generating your color image...**"
      );

    const generatingMessage = await message.reply({
      embeds: [generatingEmbed]
    });

    try {
      const imageBuffer = await generateColorImage(message.author, color);
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: "color-image.png"
      });

      const finalEmbed = new EmbedBuilder()
        .setColor(color)
        .setDescription(`🎨 **Here's your image with color ${color}!**`)
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
};

module.exports = colorCommand;