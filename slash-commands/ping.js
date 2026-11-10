const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with server & API latency"),

  async execute(interaction) {
    try {
      // Immediately acknowledge to extend the 3-second Discord timeout window to 15 minutes
      const reply = await interaction.deferReply({ fetchReply: true });
      const serverLatency = reply.createdTimestamp - interaction.createdTimestamp;
      const apiLatency = Math.round(interaction.client.ws.ping);

      await interaction.editReply(
        `Pong! 🏓\nServer Latency: ${serverLatency}ms\nAPI Latency: ${apiLatency}ms`
      );
    } catch (error) {
      // Error 10062 means the interaction expired before Render finished processing (e.g. cold start)
      if (error.code === 10062 || error.rawError?.code === 10062) {
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
      } catch (err) {
        if (err.code !== 10062 && err.rawError?.code !== 10062) {
          console.error("Failed to send error reply for /ping:", err);
        }
      }
    }
  }
};