import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../../../core/types";

export const pingSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with bot and API latency"),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      await interaction.deferReply();
      const reply = await interaction.fetchReply();
      const serverLatency = reply.createdTimestamp - interaction.createdTimestamp;
      const apiLatency = Math.round(interaction.client.ws.ping);

      const embed = new EmbedBuilder()
        .setColor(2368553)
        .setTitle("Latency")
        .setDescription(`Server Latency: ${serverLatency}ms\nAPI Latency: ${apiLatency}ms`);

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      if (error?.code === 10062 || error?.rawError?.code === 10062) {
        console.warn("[/ping] Interaction expired before reply could be delivered.");
        return;
      }

      console.error("Error in /ping command:", error);
      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply("An error occurred while fetching ping.");
        } else if (!interaction.replied) {
          await interaction.reply({
            content: "An error occurred while fetching ping.",
            ephemeral: true
          });
        }
      } catch (err: any) {
        if (err?.code !== 10062 && err?.rawError?.code !== 10062) {
          console.error("Failed to send error reply for /ping:", err);
        }
      }
    }
  }
};

export default pingSlashCommand;
