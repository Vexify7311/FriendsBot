const {
	GuildSchema,
	userSchema
} = require('../../database/models'),
	Event = require('../../structures/Event');
const config = require("../../config");
const { getGuildData } = require('../../utils/functions');

module.exports = class Ready extends Event {
	constructor(...args) {
		super(...args, {
			dirname: __dirname,
			once: true,
		});
	}

	// run event
	async run(bot) {
		// Load up audio player
		// try {
		// 	bot.manager.init(bot.user.id);
		// } catch (err) {
		// 	bot.logger.error(`Audio manager failed to load due to error: ${err.message}`);
		// }
		// Updates the bot's status
		// bot.user.setStatus('Online');
		// bot.SetActivity('LISTENING', [`@${bot.user.username}`, `${config.defaultSettings.prefix}help`]);

		await require('../../scripts/update-commands.md.js')(bot);
		bot.logger.log('=-=-=-=-=-=-=- Loading Guild Specific Interaction(s) -=-=-=-=-=-=-=');
		bot.guilds.cache.forEach(async guild => {
			let settings = await getGuildData(bot, guild.id)

			const enabledPlugins = settings.plugins;
			const data = [];

			// get slash commands for category
			for (let i = 0; i < enabledPlugins.length; i++) {
				const g = await bot.loadInteractionGroup(enabledPlugins[i], guild);
				if (Array.isArray(g)) data.push(...g);
			}

			try {
				await bot.guilds.cache.get(guild.id)?.commands.set(data)
				/*	ADD THIS WHEN MODERATION SLASH COMMANDS ARE ADDED
					.then(async interactionIDs => {
						if (guild.settings.plugins.find(plugin => plugin === 'Moderation')) {
							const category = (await readdir('./src/commands/Moderation/')).filter((v, i, a) => a.indexOf(v) === i);
							const lockedInteractions = [];
							const permissions = [];

							guild.settings.ModeratorRoles.forEach(roleID => {
								const role = guild.roles.cache.get(roleID);
								if (role) permissions.push({ id: role.id, type: 'ROLE', permission: true });
							});
							if (permissions.length >= 1) {
								category.forEach(async (cmd) => {
									if (!bot.config.disabledCommands.includes(cmd.replace('.js', ''))) {
										const interactionID = interactionIDs.find(interactionCmd => interactionCmd.name === cmd.replace('.js', ''));
										if (interactionID) lockedInteractions.push({ id: interactionID.id, permissions: permissions });
									}
								});
								guild.commands.setPermissions(lockedInteractions);
							}
						}
					});
				*/
				bot.logger.log('Loaded Interactions for guild: ' + guild.name);
			} catch (err) {
				bot.logger.error(`Failed to load interactions for guild: ${guild.id} due to: ${err.message}.`);
			}
		});

		// Delete server settings on servers that removed the bot while it was offline
		const data = await GuildSchema.find({});
		// A server kicked the bot when it was offline
		const guildCount = [];
		// Get bot guild ID's
		for (let i = 0; i < bot.guilds.cache.size; i++) {
			guildCount.push(bot.guilds.cache.array()[i].id);
		}
		// Now check database for bot guild ID's
		for (let i = 0; i < data.length; i++) {
			if (!guildCount.includes(data[i].guildID)) {
				const guild = {
					id: `${data[i].guildID}`,
				};
				bot.emit('guildDelete', guild);
			}
		}

		bot.logger.ready('All guilds have been initialized.');

		// Every 1 minutes fetch new guild data
		// setInterval(async () => {
		// 	if (bot.config.debug) bot.logger.debug('Fetching guild settings (Interval: 1 minutes)');
		// 	bot.guilds.cache.forEach(async guild => {
		// 		await guild.fetchSettings()
		// 	});
		// }, 60000);

		// check for premium users
		// const users = await userSchema.find({});
		// for (let i = 0; i < users.length; i++) {
		// 	const user = await bot.users.fetch(users[i].userID);
		// 	// const userData = users[i];
		// 	// user = { ...user, ...userData };
		// 	user.premium = users[i].premium;
		// 	user.premiumSince = users[i].premiumSince ?? 0;
		// 	user.premiumUses = users[i].premiumUses;
		// 	user.guilds = users[i].guilds;
		// }

		// bot.logger.ready(`${premium.length} premium tier(s) have been applied. (${users} users, ${guilds} guilds)`);

		// LOG ready event
		bot.logger.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=', 'ready');
		bot.logger.log(`${bot.user.tag}, ready to serve [${bot.users.cache.size}] users in [${bot.guilds.cache.size}] servers.`, 'ready');
		bot.logger.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=', 'ready');
	}
};