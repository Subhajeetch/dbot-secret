const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("ping").setDescription("Replies with server & API latency"),

    async execute(interaction) {
        try {
            const reply = await interaction.reply({ content: "Pinging...", fetchReply: true });
            const serverLatency = reply.createdTimestamp - interaction.createdTimestamp;
            const apiLatency = Math.round(interaction.client.ws.ping);

            await interaction.editReply(
                `Pong! 🏓\nServer Latency: ${serverLatency}ms\nAPI Latency: ${apiLatency}ms`
            );
        } catch (error) {
            console.error("Error in /ping command:", error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply("An error occurred while fetching ping.");
                } else {
                    await interaction.reply("An error occurred while fetching ping.");
                }
            } catch (err) {
                console.error("Failed to send error reply for /ping:", err);
            }
        }
    }
};
