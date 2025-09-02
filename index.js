import { Client, GatewayIntentBits, AttachmentBuilder } from "discord.js";
import { randomUUID } from "crypto";
// import { config } from "dotenv";

// config();

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
    .replaceAll(" idk ", " i don't know ")
    .replaceAll(" ill ", " I'll ")
    .replaceAll(" ur ", " your ")
    .replaceAll(" dont ", " don't ")
    .replaceAll(" didnt ", " didn't ")
    .replaceAll(" wont ", " won't ")
    .replaceAll(" assa ", " assassination ")
    .replaceAll(" def ", " definitely ")
    .replaceAll(" st ", " secret technique ")
    .replaceAll(" sd ", " shadow dance ")
    .replaceAll(" ss ", " shadow step ");
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
      const aiReqBody = {
        model: "deepseek-r1:8b",
        think: false,
        stream: false,
        system:
          'you are a simple ai tasked with processing user text to fix grammar and expand abbreviations without changing the original words, including profanities, unless absolutely necessary for clarity.  Remove the abbreviations completely, do not include them after words in parentheses. Remove the abbreviations completely, do not include them after words in parentheses. Remove the abbreviations completely, do not include them after words in parentheses. You are not to include anything in your output that is not the output of what I requested. Do not Tell me what you corrected. You are to respond ONLY in raw JSON format with the an output "message" key containing the modified input text with perfect grammar and a "summery" key with a one sentence summary of the input prompt in world of warcraft style gamer banter. Do not put the RAW JSON in mark down syntax block',
        prompt: fixHisGramer(message.content),
      };

      const aiRes = await fetch(process.env.AI_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(aiReqBody),
      });

      if (!aiRes.ok) {
        throw new Error("failed to get audio from speech endpoint.");
      }

      const data = await aiRes.json();

      const aiResponse = JSON.parse(
        data.response.replaceAll("```json", "").replaceAll("```", "")
      );

      const reqBody = {
        download_format: "mp3",
        input: aiResponse.message,
        return_download: true,
        speed: 1,
        stream: false,
        voice: "am_puck",
      };

      const response = await fetch(process.env.SPEECH_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        throw new Error("failed to get audio from speech endpoint.");
      }

      const blob = await response.arrayBuffer();

      const file = Buffer.from(blob);

      console.log(aiResponse);

      await message.reply({
        content: aiResponse.summary,
        files: [
          new AttachmentBuilder(file, {
            name: randomUUID() + ".mp3",
          }),
        ],
      });
      console.log("Audio file sent successfully!");
      // await fs.rm(filePath);
    } catch (error) {
      console.error("Error sending audio:", error);
      await message.reply(
        `Failed to send audio file. Error: ${error?.message || "unknown"}`
      );
    }
  }
});

client.login(process.env.BOT_TOKEN);
