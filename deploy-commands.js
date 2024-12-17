const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

const commands = [];
let musicCommands = [];

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	// console.log(folder);
	for (const file of commandFiles) {
		// console.log(file);
		if (file == "help.js") {
			const command = require(`./commands/utility/${file}`);
			musicCommands.push(command);
			continue;
		}
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}


const rest = new REST().setToken(token);

(async () => {
	try {

		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			// Routes.applicationCommands(clientId), // To deploy global commands
			Routes.applicationGuildCommands(clientId, guildId), // To deploy guild commands
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data?.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();