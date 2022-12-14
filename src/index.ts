// Require the necessary discord.js classes
import chalk from "chalk";
import fs from "node:fs";
import { fileURLToPath } from "url";
import path from "node:path";
import {
  Client,
  Events,
  Collection,
  GatewayIntentBits,
  ActivityType,
  REST,
  Routes,
} from "discord.js";
import "dotenv/config";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Create a new client instance
const client: any = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, "commands");

const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = `./commands/${file}`;
  console.log(filePath);
  const { default: command } = await import(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.log(
      chalk.yellow(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      )
    );
  }
}

// Construct and prepare an instance of the REST module

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log(`Successfully reloaded application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
  console.log(
    chalk.white(`Ready! Logged in as `) + chalk.blue.bold(c.user.tag)
  );
  /* Delete
  rest
    .get(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      )
    )
    .then((data) => {
      const promises = [];
      for (const command of data) {
        const deleteUrl = `${Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID
        )}/${command.id}`;
        promises.push(rest.delete(deleteUrl));
      }
      return Promise.all(promises);
    });*/
  client.user.setPresence({
    activities: [
      { name: `v0.0.4 | dsc.gg/turing`, type: ActivityType.Playing },
    ],
    status: "online",
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});
// Log in to Discord with your client's token
client.login(process.env.TOKEN);
