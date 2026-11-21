import { Message } from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { afkService } from "../../../services/afk.service";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const afkCommand: PrefixCommand = {
  name: "afk",
  description: "Set your AFK status with an optional reason",
  category: "utility",
  async execute(message, args) {
    try {
      const reason = args.join(" ") || "AFK";
      const userId = message.author.id;

      if (afkService.isAfk(userId)) {
        const alreadyAfkEmbed = errorEmbed("You are already AFK.");
        const reply = await message.reply({ embeds: [alreadyAfkEmbed] });
        setTimeout(() => reply.delete().catch(() => {}), 10000);
        return;
      }

      await afkService.setAfk(userId, reason);

      const embed = successEmbed(`Your AFK status is set.\nReason: ${reason}`, "AFK Set");
      return await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in AFK command:", error);
      const errorAfkEmbed = errorEmbed("An error occurred while setting AFK.");
      return await message.reply({ embeds: [errorAfkEmbed] });
    }
  }
};

export default afkCommand;
