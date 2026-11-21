import { AttachmentBuilder } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { imageService } from "../../../services/image.service";

export const levelCommand: PrefixCommand = {
  name: "lv",
  description: "Displays your current level card",
  category: "fun",
  async execute(message) {
    try {
      const currentExp = 1400;
      const maxExp = 8500;
      const percentage = (currentExp / maxExp) * 100;
      const progress = (percentage / 100) * 770;

      const avatarURL = message.author.displayAvatarURL({
        extension: "png",
        size: 256,
        forceStatic: true
      });

      const avatarBuffer = await imageService.fetchImageBuffer(avatarURL);

      const cardBuffer = await imageService.generateLevelUpCard({
        avatarBuffer,
        currentExp,
        maxExp,
        username: message.author.username,
        progress
      });

      const attachment = new AttachmentBuilder(cardBuffer, {
        name: "level-up.png"
      });

      await message.reply({ files: [attachment] });
    } catch (error) {
      console.error("Error generating level-up card:", error);
      await message.reply("Failed to generate the level-up image.");
    }
  }
};

export default levelCommand;
