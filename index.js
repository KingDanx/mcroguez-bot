import { Client, GatewayIntentBits, AttachmentBuilder } from "discord.js";
import fs from "fs/promises";
import EdgeTTS from "@kingdanx/edge-tts-js";
import { randomUUID } from "crypto";
import { config } from "dotenv";

config();

const speaker = new EdgeTTS();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function fixHisGramer(message) {
  return message
    .toLowerCase()
    .replaceAll("\r", "")
    .replaceAll("\n", "")
    .replaceAll(" im ", " I'm ")
    .replaceAll(" ill ", " I'll ")
    .replaceAll(" ur ", " your ")
    .replaceAll(" dont ", " don't ")
    .replaceAll(" didnt ", " didn't ")
    .replaceAll(" wont ", " won't ")
    .replaceAll(" assa ", " assassination ")
    .replaceAll(" def ", " definitely ");
}

client.once("clientReady", () => {
  console.log(
    `Bot is online as ${client.user.tag}! Monitoring channel ${process.env.CHANNEL_ID}.`
  );
});

// Event: Trigger on new messages in the specified channel
client.on("messageCreate", async (message) => {
  if (message.channel.id !== process.env.CHANNEL_ID) {
    return;
  }
  if (message.author.id !== process.env.USER_ID) {
    return;
  }

  if (message.content.length >= Number(process.env.CHARACTER_LIMIT)) {
    try {
      speaker.tts.setVoiceParams({
        text: fixHisGramer(message.content),
      });

      const filePath = await speaker.ttsToFile("temp");

      const file = await fs.readFile(filePath);

      await message.reply({
        files: [
          new AttachmentBuilder(file, {
            name: randomUUID() + ".mp3",
          }),
        ],
      });
      console.log("Audio file sent successfully!");
      await fs.rm(filePath);
    } catch (error) {
      console.error("Error sending audio:", error);
      await message.reply("Failed to send audio file.");
    }
  }
});

client.login(process.env.BOT_TOKEN);
