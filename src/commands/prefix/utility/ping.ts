import { Message } from "discord.js";
import { PrefixCommand } from "../../../core/types";

export const pingCommand: PrefixCommand = {
  name: "ping",
  description: "Replies with bot latency and Discord API latency",
  category: "utility",
  async execute(message, _args, client) {
    const ping = Date.now() - message.createdTimestamp;
    const apiPing = Math.round(client.ws.ping);
    return message.reply(`Pong! 🏓\nServer Latency: ${ping}ms\nAPI Latency: ${apiPing}ms`);
  }
};

export default pingCommand;
