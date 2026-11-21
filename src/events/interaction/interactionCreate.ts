import { Events, Interaction } from "discord.js";
import { BotEvent } from "../../core/types";
import { errorEmbed } from "../../utils/embeds";

export const interactionCreateEvent: BotEvent<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  async execute(client, interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error: any) {
      if (error?.code === 10062 || error?.rawError?.code === 10062) {
        console.warn(
          `Interaction /${interaction.commandName} expired before response could be sent.`
        );
        return;
      }

      console.error(`Error executing /${interaction.commandName}:`, error);
      try {
        const errorMsg = errorEmbed("An error occurred while executing this command.");
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ embeds: [errorMsg] });
        } else if (!interaction.replied) {
          await interaction.reply({
            embeds: [errorMsg],
            ephemeral: true
          });
        }
      } catch (err: any) {
        if (err?.code !== 10062 && err?.rawError?.code !== 10062) {
          console.error("Failed to send error reply:", err);
        }
      }
    }
  }
};

export default interactionCreateEvent;
