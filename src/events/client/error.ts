import { Events } from "discord.js";
import { BotEvent } from "../../core/types";

export const errorEvent: BotEvent<Events.Error> = {
  name: Events.Error,
  execute(_client, error) {
    console.error("Discord Client Error:", error);
  }
};

export default errorEvent;
