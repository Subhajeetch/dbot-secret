import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder
} from "discord.js";
import { SlashCommand } from "../../../core/types";
import { imageService } from "../../../services/image.service";
import { errorEmbed } from "../../../utils/embeds";

export const levelSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("Displays your current level card")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user whose level card you want to view")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser("user") || interaction.user;
      const currentExp = 1400;
      const maxExp = 8500;
      const percentage = (currentExp / maxExp) * 100;
      const progress = (percentage / 100) * 770;

      const avatarURL = targetUser.displayAvatarURL({
        extension: "png",
        size: 256,
        forceStatic: true
      });

      const avatarBuffer = await imageService.fetchImageBuffer(avatarURL);

      const cardBuffer = await imageService.generateLevelUpCard({
        avatarBuffer,
        currentExp,
        maxExp,
        username: targetUser.username,
        progress
      });

      const attachment = new AttachmentBuilder(cardBuffer, {
        name: "level-up.png"
      });

      const embed = new EmbedBuilder()
        .setColor(2368553)
        .setDescription(`Level card for **${targetUser.username}**`)
        .setImage("attachment://level-up.png");

      await interaction.editReply({
        embeds: [embed],
        files: [attachment]
      });
    } catch (error) {
      console.error("Error generating level card:", error);
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          embeds: [errorEmbed("Failed to generate the level card.")]
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          embeds: [errorEmbed("Failed to generate the level card.")],
          ephemeral: true
        });
      }
    }
  }
};

export default levelSlashCommand;
