// Dependencies
const {
	Client,
	Collection
} = require('discord.js'), {
		GuildSchema
	} = require('../database/models'), {
		KSoftClient
	} = require('@ksoft/api'),
	path = require('path'), {
		promisify
	} = require('util'),
	readdir = promisify(require('fs').readdir);

// Creates Egglord class
module.exports = class Egglord extends Client {
	constructor() {
		super({
			messageCacheMaxSize: -1,
			messageCacheLifetime: 1210000,
			messageSweepInterval: 86400,
			partials: ['GUILD_MEMBER', 'USER', 'MESSAGE', 'CHANNEL', 'REACTION'],
			intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_EMOJIS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES', 'GUILD_VOICE_STATES', 'GUILD_INVITES'],
			restGlobalRateLimit: 50,
			presence: {
				status: 'online',
				activities: [{
					name: 'm?help',
					type: 'LISTENING',
					url: 'https://www.twitch.tv/vexi_fy',
				}],
			},
		});
		// for console logging
		this.logger = require('../utils/Logger');

		// For command handler
		this.aliases = new Collection();
		this.commands = new Collection();
		this.interactions = new Collection();
		this.cooldowns = new Collection();
		// connect to database
		this.mongoose = require('../database/mongoose');
		// config file
		this.config = require('../config.js');
		// for Activity
		this.Activity = [];
		this.PresenceType = 'LISTENING';
		// for KSOFT API
		if (this.config.api_keys.ksoft) {
			this.Ksoft = new KSoftClient(this.config.api_keys.ksoft);
		}
		// Basic statistics for the bot
		this.messagesSent = 0;
		this.commandsUsed = 0;
		// for emojis
		this.customEmojis = require('../assets/json/emojis.json');
		// for language translation
		this.languages = require('../languages/language-meta.json');
		// for waiting for things
		this.delay = ms => new Promise(res => setTimeout(res, ms));
	}
	// when the bot joins create guild settings
	async CreateGuild(settings) {
		try {
			const newGuild = new GuildSchema(settings);
			return await newGuild.save();
		} catch (err) {
			if (this.config.debug) this.logger.debug(err.message);
			return false;
		}
	}
	// Delete guild from server when bot leaves server
	async DeleteGuild(guild) {
		try {
			await GuildSchema.findOneAndRemove({
				guildID: guild.id
			});
			return true;
		} catch (err) {
			if (this.config.debug) this.logger.debug(err.message);
			return false;
		}
	}
	// Set bot's activity
	SetActivity(type, array = []) {
		this.Activity = array;
		this.PresenceType = type;
		try {
			let j = 0;
			setInterval(() => this.user.setActivity(`${this.Activity[j++ % this.Activity.length]}`, {
				type: type,
				url: 'https://www.twitch.tv/vexi_fy'
			}), 300000);
			return;
		} catch (e) {
			console.log(e);
		}
	}
	// Load a command
	loadCommand(commandPath, commandName) {
		const cmd = new(require(`.${commandPath}${path.sep}${commandName}`))(this);
		this.logger.log(`Loading Command: ${cmd.help.name}.`);
		cmd.conf.location = commandPath;
		this.commands.set(cmd.help.name, cmd);
		cmd.help.aliases.forEach((alias) => {
			this.aliases.set(alias, cmd.help.name);
		});
	}
	// Loads a slash command category
	async loadInteractionGroup(category) {
		try {
			const commands = (await readdir('./src/commands/' + category + '/')).filter((v, i, a) => a.indexOf(v) === i);
			const arr = [];
			commands.forEach((cmd) => {
				if (!this.config.disabledCommands.includes(cmd.replace('.js', ''))) {
					const command = new(require(`../commands/${category}${path.sep}${cmd}`))(this);
					if (command.conf.slash) {
						const item = {
							name: command.help.name,
							description: command.help.description,
							defaultPermission: command.conf.defaultPermission,
						};
						if (command.conf.options[0]) {
							item.options = command.conf.options;
						}
						arr.push(item);
					}
				}
			});
			return arr;
		} catch (err) {
			return `Unable to load category ${category}: ${err}`;
		}
	}
	// Deletes a slash command category
	async deleteInteractionGroup(category, guild) {
		try {
			const commands = (await readdir('./src/commands/' + category + '/')).filter((v, i, a) => a.indexOf(v) === i);
			const arr = [];
			commands.forEach((cmd) => {
				if (!this.config.disabledCommands.includes(cmd.replace('.js', ''))) {
					const command = new(require(`../commands/${category}${path.sep}${cmd}`))(this);
					if (command.conf.slash) {
						arr.push({
							name: command.help.name,
							description: command.help.description,
							options: command.conf.options,
							defaultPermission: command.conf.defaultPermission,
						});
						guild.interactions.delete(command.help.name, command);
					}
				}
			});
			return arr;
		} catch (err) {
			return `Unable to load category ${category}: ${err}`;
		}
	}
	// Unload a command (you need to load them again)
	async unloadCommand(commandPath, commandName) {
		let command;
		if (this.commands.has(commandName)) {
			command = this.commands.get(commandName);
		} else if (this.aliases.has(commandName)) {
			command = this.commands.get(this.aliases.get(commandName));
		}
		if (!command) return `The command \`${commandName}\` doesn't seem to exist, nor is it an alias. Try again!`;
		delete require.cache[require.resolve(`.${commandPath}${path.sep}${commandName}.js`)];
		return false;
	}
	// Handle slash command callback
	async send(interaction, content) {
		await interaction.reply(content);
		if (this.config.debug) this.logger.debug(`Interaction: ${interaction.commandName} was ran by ${interaction.user.username}.`);
		this.commandsUsed++;
	}
	// This will get the translation for the provided text
	translate(key, args, locale) {
		if (!locale) locale = this.config.defaultSettings.Language;
		const language = this.translations.get(locale);
		if (!language) return 'Invalid language set in data.';
		return language(key, args);
	}
	// for adding embeds to the webhook manager
	addEmbed(channelID, embed) {
		// collect embeds
		if (!this.embedCollection.has(channelID)) {
			this.embedCollection.set(channelID, [embed]);
		} else {
			this.embedCollection.set(channelID, [...this.embedCollection.get(channelID), embed]);
		}
	}
};