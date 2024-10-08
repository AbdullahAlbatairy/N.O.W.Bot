import { REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";

const commandsToDeploy = Object.values(commands).map((command) => command.data);

const rest = new REST().setToken(config.DISCORD_TOKEN);

export async function deployCommands() {
    try {
        console.log("Started refreshing application (/) commands.");
    
        await rest.put(
          Routes.applicationCommands(config.APP_ID),
          {
            body: commandsToDeploy,
          }
        );
    
        console.log("Successfully reloaded application (/) commands.");
      } catch (error) {
        console.error(error);
      }
}


