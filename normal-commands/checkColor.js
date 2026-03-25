const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const serverPrifix = require("../prifix.js");
const generateColorImage = require("../imagemagick_templates/genColorChecker.js");
const { errorEmbed } = require("../utils/embeds.js");

const colorCommand = async message => {
    if (message.content.startsWith(`${serverPrifix}color`)) {
        try {
            const args = message.content.split(" ").slice(1); // Get arguments after command

            // Get color from arguments or use default
            let color = args[0] || '#ffffff';

            // Ensure color has # prefix if it's a hex code
            if (color.match(/^[0-9A-Fa-f]{6}$/)) {
                color = '#' + color;
            } else if (!color.startsWith('#') && color.match(/^[0-9A-Fa-f]{3,6}$/)) {
                color = '#' + color;
            }

            // Validate hex color format
            const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            if (!hexColorRegex.test(color)) {
                const invalidColorEmbed = errorEmbed(
                    "Please provide a valid hex color code (e.g., #FF0000 or #F00)"
                );
                await message.reply({ embeds: [invalidColorEmbed] });
                return;
            }

            // Send "Generating..." embed
            const generatingEmbed = new EmbedBuilder()
                .setColor("#FFA500")
                .setDescription(
                    "<a:loading:1310179353165959198>   **Generating your color image...**"
                );

            const generatingMessage = await message.reply({
                embeds: [generatingEmbed]
            });

            try {
                // Generate the color image
                const imageBuffer = await generateColorImage(message.author, color);

                // Create attachment
                const attachment = new AttachmentBuilder(imageBuffer, {
                    name: 'color-image.png'
                });

                const finalEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setDescription(`🎨 **Here's your image with color ${color}!**`)
                    .setImage('attachment://color-image.png');

                // Edit the original message with the final embed and attach the file
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

module.exports = colorCommand;
