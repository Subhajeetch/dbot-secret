import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  User
} from "discord.js";
import { SlashCommand } from "../../../core/types";
import { imageService } from "../../../services/image.service";
import { errorEmbed } from "../../../utils/embeds";

const getAvatarURL = (user: User, staticForSharp = false): string => {
  if (staticForSharp) {
    return user.displayAvatarURL({ extension: "png", size: 512, forceStatic: true });
  }
  return user.displayAvatarURL({ size: 4096 });
};

export const avatarSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("View user avatar or combine two avatars into a love image")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user whose avatar you want to view")
        .setRequired(false)
    )
    .addUserOption(option =>
      option
        .setName("user2")
        .setDescription("Second user for a combined love image")
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName("heart")
        .setDescription("Add a glowing heart between avatars (requires user2)")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const targetUser1 = interaction.options.getUser("user") || interaction.user;
      const targetUser2 = interaction.options.getUser("user2");
      const showHeart = interaction.options.getBoolean("heart") ?? false;

      await interaction.deferReply();

      if (targetUser2) {
        try {
          const avatarURL1 = getAvatarURL(targetUser1, true);
          const avatarURL2 = getAvatarURL(targetUser2, true);

          const imageBuffer = await imageService.generateLoveImage(
            avatarURL1,
            avatarURL2,
            showHeart
          );

          const attachment = new AttachmentBuilder(imageBuffer, {
            name: "avatar-duo.png"
          });

          const finalEmbed = new EmbedBuilder()
            .setColor(2368553)
            .setDescription(`Combined avatar of ${targetUser1.username} and ${targetUser2.username}`)
            .setImage("attachment://avatar-duo.png");

          await interaction.editReply({
            embeds: [finalEmbed],
            files: [attachment]
          });
        } catch (err) {
          console.error("Error generating the love image:", err);
          await interaction.editReply({
            embeds: [errorEmbed("Something went wrong while generating the combined image.")]
          });
        }
      } else {
        const avatarURL = getAvatarURL(targetUser1, false);
        const embed = new EmbedBuilder()
          .setColor(2368553)
          .setDescription(`Avatar for **${targetUser1.username}**`)
          .setImage(avatarURL);

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error in /avatar command:", error);
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          embeds: [errorEmbed("Unable to fetch the avatar.")]
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          embeds: [errorEmbed("Unable to fetch the avatar.")],
          ephemeral: true
        });
      }
    }
  }
};

export default avatarSlashCommand;
