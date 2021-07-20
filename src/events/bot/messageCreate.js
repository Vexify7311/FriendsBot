// Dependencies
const {
	Collection,
	MessageEmbed
} = require('discord.js'),
	Event = require('../../structures/Event');
const {
	userSchema
} = require('../../database/models');
const requestcmd = require('../../handlers/requestcmd');
const {
	isrequestchannel, getGuildData, getUserData
} = require('../../utils/functions');

module.exports = class Message extends Event {
	constructor(...args) {
		super(...args, {
			dirname: __dirname,
		});
	}

	// run event
	async run(bot, msg) {

		// Should not respond to bots
		if (msg.author.bot) return;
		// Get server settings
		let settings = await getGuildData(bot, msg.guild.id)
		if (Object.keys(settings).length == 0) return;
		let usersettings = await getUserData(bot, msg.author.id)
		if (Object.keys(usersettings).length == 0) return;
		//Check if bot was mentioned
		if ([`<@${bot.user.id}>`, `<@!${bot.user.id}>`].find(p => msg.content == p)) {
			if (settings.CustomChannel) {
				let embed = new MessageEmbed()
					.setColor(bot.config.color)
					.setTitle("Settings for this server")
					.setDescription(`The prefix is set to: \`${settings.prefix}\`\nServer ID: \`${msg.guild.id}\`\n\nType \`${settings.prefix}help\` for the list of commands.`)
					.setFooter("Developed by Vexify#7311")

				return msg.channel.send({
					embeds: [embed]
				}).then(m => {
					setTimeout(() => m.delete(), bot.config.DeleteTimeout)
				}).catch((err) => {
					console.error(err)
				})
			} else {
				let embed = new MessageEmbed()
					.setColor(bot.config.color)
					.setTitle("Settings for this server")
					.setDescription(`The prefix is set to: \`${settings.prefix}\`\nServer ID: \`${msg.guild.id}\`\n\nType \`${settings.prefix}help\` for the list of commands.`)
					.setFooter("Developed by Vexify#7311")

				return msg.channel.send({
					embeds: [embed]
				}).then(m => {
					setTimeout(() => m.delete(), bot.config.DeleteTimeout)
				}).catch((err) => {
					console.error(err)
				})
			}
		}

		var irc = await isrequestchannel(bot, msg.channel.id, msg.guild.id)
		if (irc) return await requestcmd(bot, msg, settings, usersettings)

		// Check if message was a command
		const args = msg.content.split(' ');
		if ([settings.prefix, `<@${bot.user.id}>`, `<@!${bot.user.id}>`].find(p => msg.content.startsWith(p))) {
			const command = args.shift().slice(settings.prefix.length).toLowerCase();
			let cmd = bot.commands.get(command) || bot.commands.get(bot.aliases.get(command));
			if (!cmd && [`<@${bot.user.id}>`, `<@!${bot.user.id}>`].find(p => msg.content.startsWith(p))) {
				// check to see if user is using mention as prefix
				cmd = bot.commands.get(args[0]) || bot.commands.get(bot.aliases.get(args[0]));
				args.shift();
				if (!cmd) return;
			} else if (!cmd) {
				return;
			}
			msg.args = args;
			if (msg.deletable) msg.delete();
			// Check if user is banned from using commands or not
			if (usersettings.guilds.includes(msg.guild.id)) {
				return;
			}

			// check permissions
			if (msg.guild) {
				// check bot permissions
				const requiredPERMS = ["MANAGE_CHANNELS", "ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "CONNECT", "SPEAK", "USE_VAD", "MUTE_MEMBERS"]
				let PERMS = [];
				const guild = bot.guilds.cache.get(msg.guild.id)
				if (!guild.me.permissions.has(requiredPERMS)) {
					requiredPERMS.forEach(perms => {
						guild.me.permissions.has(perms)
						if (guild.me.permissions.has(perms)) {
							PERMS.push(`✅ ${perms}`)
						} else {
							PERMS.push(`❌ ${perms}`)
						}
					})
				}

				// DISPLAY MISSING BOT PERMISSIONS
				if (PERMS.length > 0) {
					let embed = new MessageEmbed()
						.setColor(bot.config.colorWrong)
						.setTitle(`I need the following permissions to fully function!`)
						.setDescription(`${PERMS.join("\n")}`)

					//CHANNEL SEND EMBED
					return msg.channel.send({
						embeds: [embed]
					}).then(m => {
						setTimeout(() => m.delete(), bot.config.DeleteTimeout)
					}).catch((err) => {
						console.error(err)
					})
				}

				// check user permissions
				let neededPermissions = [];
				cmd.conf.userPermissions.forEach((perm) => {
					if (!msg.channel.permissionsFor(msg.member).has(perm)) {
						neededPermissions.push(perm);
					}
				});

				// Display missing user permissions
				if (neededPermissions.length > 0) {
					let embed = new MessageEmbed()
						.setColor(bot.config.colorWrong)
						.setDescription(`You need \`${neededPermissions.join(", ")}\` permissions for that command.`)


					//CHANNEL SEND EMBED
					return msg.channel.send({
						embeds: [embed]
					}).then(m => {
						setTimeout(() => m.delete(), bot.config.DeleteTimeout)
					}).catch((err) => {
						console.error(err)
					})
				}
			}

			// Check to see if user is in 'cooldown'
			if (!bot.cooldowns.has(cmd.help.name)) {
				bot.cooldowns.set(cmd.help.name, new Collection());
			}

			const now = Date.now(),
				timestamps = bot.cooldowns.get(cmd.help.name),
				cooldownAmount = (cmd.conf.cooldown || 2000);

			if (timestamps.has(msg.author.id)) {
				const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

				if (now < expirationTime) {
					const timeLeft = `00:01`; //timeLeft.toFixed(1)
					const embed = new MessageEmbed()
						.setColor(bot.config.colorWrong)
						.setDescription(`This command is on cooldown for another \`${timeLeft}\`.`)

					//CHANNEL SEND EMBED
					return msg.channel.send({
						embeds: [embed]
					}).then(m => {
						setTimeout(() => m.delete(), bot.config.DeleteTimeout)
					}).catch((err) => {
						console.error(err)
					})
				}
			}

			// Check if user can use premium commands
			if (cmd.conf.premiumOnly && !(settings.premium || settings.permpremium || usersettings.premium)) {

				let premiumonly = new MessageEmbed()
					.setColor(bot.config.colorOrange)
					.setDescription(`This command requires the server to be a premium server.\n[Click here](${bot.config.premiumLink}) to have a look at our Premium offers.`)
				
				return msg.channel.send({
					embeds: [premiumonly]
				}).then(m => {
					setTimeout(() => m.delete(), bot.config.DeleteTimeout)
				}).catch((err) => {
					console.error(err)
				})
			}
			// Check if user can run voterequireded commands
			if (cmd.conf.reqVote && !(settings.permvote || usersettings.hasVoted)) {
				let voteonly = new MessageEmbed()
					.setColor(bot.config.colorOrange)
					.setDescription(`This command requires you to vote.\n[Click here](${bot.config.voteLink}) to vote and use this command for the next 12 hours.`)

				return msg.channel.send({
					embeds: [voteonly]
				}).then(m => {
					setTimeout(() => m.delete(), bot.config.DeleteTimeout)
				}).catch((err) => {
					console.error(err)
				})
			}
			// Check if there is a CustomChannel and a music command is beeing ran outside of the customchannel
			if (settings.CustomChannel && cmd.conf.music) {
				let embed = new MessageEmbed()
					.setColor(bot.config.colorOrange)
					.setDescription(`This command is restricted to <#${settings.mChannelID}>.`)

				return msg.channel.send({
					embeds: [embed]
				}).then(m => {
					setTimeout(() => m.delete(), bot.config.DeleteTimeout)
				}).catch((err) => {
					console.error(err)
				})
			}
			if (cmd.conf.music) {
				const player = bot.manager.players.get(msg.guild.id)
				if (cmd.conf.reqplayer) {
					if (!player) {
						let embed = new MessageEmbed()
							.setColor(bot.config.colorWrong)
							.setDescription(`The bot is currently not playing.`)

						return msg.channel.send({
							embeds: [embed]
						}).then(m => {
							setTimeout(() => m.delete(), bot.config.DeleteTimeout)
						}).catch((err) => {
							console.error(err)
						})
					}
				}
				if (cmd.conf.reqvc) {
					const {
						channel
					} = msg.member.voice;
					if (!channel) {
						let embed = new MessageEmbed()
							.setColor(bot.config.colorOrange)
							.setDescription('You have to join a voice channel first.')

						return msg.channel.send({
							embeds: [embed]
						}).then(m => {
							setTimeout(() => m.delete(), bot.config.DeleteTimeout)
						}).catch((err) => {
							console.error(err)
						})
					}
					if (player && (channel.id !== player.voiceChannel)) {
						let embed = new MessageEmbed()
							.setColor(bot.config.colorOrange)
							.setDescription(`I'm already playing in a different voice channel!`)

						return msg.channel.send({
							embeds: [embed]
						}).then(m => {
							setTimeout(() => m.delete(), bot.config.DeleteTimeout)
						}).catch((err) => {
							console.error(err)
						})
					}
				}
			}
			if (bot.config.debug) bot.logger.debug(`Command: ${cmd.help.name} was ran by ${msg.author.tag}${!msg.guild ? ' in DM\'s' : ` in guild: ${msg.guild.id}`}.`);
			cmd.run(bot, msg, settings, usersettings);
			timestamps.set(msg.author.id, now);
			setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);
		}
	}
};