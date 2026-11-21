import dotenv from "dotenv";
dotenv.config();

import { ActivityType } from "discord.js";
import { welcomeMessages } from "./welcomeMessages";

export interface BotConfig {
  token: string;
  guildId?: string;
  port: number;
  defaultPrefix: string;
  avatarCooldownMs: number;
  statusRotationMinutes: number;
  avatarRotationHours: number;
  statuses: Array<{ name: string; type: ActivityType }>;
  avatarImages: string[];
  welcomeMessages: string[];
}

export const config: BotConfig = {
  token: process.env.TOKEN || "",
  guildId: process.env.GUILD_ID || undefined,
  port: Number(process.env.PORT) || 8080,
  defaultPrefix: "?",
  avatarCooldownMs: 12 * 60 * 60 * 1000,
  statusRotationMinutes: 1,
  avatarRotationHours: 6,
  avatarImages: [
    "images/snow_animekun.gif",
    "images/picture2.jpg",
    "images/picture3.jpg",
    "images/picture4.jpg",
    "images/picture5.jpg",
    "images/picture6.jpg",
    "images/picture7.jpg",
    "images/picture8.jpg",
    "images/picture9.jpg"
  ],
  welcomeMessages,
  statuses: [
    { name: "Watching You Pooping", type: ActivityType.Watching },
    { name: "Listening to your Nonsense", type: ActivityType.Listening },
    { name: "Playing with your Heart", type: ActivityType.Playing },
    { name: "Listening to your excuses", type: ActivityType.Listening },
    { name: "Watching you pretend to work", type: ActivityType.Watching },
    { name: "Playing nice... for now!", type: ActivityType.Playing },
    { name: "Watching you struggle", type: ActivityType.Watching },
    { name: "Playing dumb", type: ActivityType.Playing },
    { name: "Watching you panic", type: ActivityType.Watching },
    { name: "Playing it cool", type: ActivityType.Playing },
    { name: "Watching your mess", type: ActivityType.Watching },
    { name: "Playing along", type: ActivityType.Playing },
    { name: "Watching your every move", type: ActivityType.Watching },
    { name: "Playing hide and seek", type: ActivityType.Playing },
    { name: "Watching the world burn", type: ActivityType.Watching },
    { name: "Listening to your problems", type: ActivityType.Listening },
    { name: "Watching your every mistake", type: ActivityType.Watching },
    { name: "Playing with your mind", type: ActivityType.Playing },
    { name: "Playing nice with everyone", type: ActivityType.Playing },
    { name: "Watching you fail again", type: ActivityType.Watching },
    { name: "Listening to endless drama", type: ActivityType.Listening },
    { name: "Playing with broken hearts", type: ActivityType.Playing },
    { name: "Watching you overthink everything", type: ActivityType.Watching },
    { name: "Listening to endless excuses", type: ActivityType.Listening },
    { name: "Playing on borrowed time", type: ActivityType.Playing },
    { name: "Listening to you complain", type: ActivityType.Listening },
    { name: "Watching you lose control", type: ActivityType.Watching },
    { name: "Listening to bad advices", type: ActivityType.Listening },
    { name: "Playing tricks on you", type: ActivityType.Playing },
    { name: "Watching your bold moves", type: ActivityType.Watching },
    { name: "Listening to daily drama", type: ActivityType.Listening },
    { name: "Watching you act tough", type: ActivityType.Watching },
    { name: "Playing dumb today", type: ActivityType.Playing },
    { name: "Watching your cringe texts", type: ActivityType.Watching },
    { name: "Playing with fire", type: ActivityType.Playing }
  ]
};

export default config;
