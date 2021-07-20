// Dependencies
const { MessageEmbed, Collection } = require("discord.js");
const Event = require('../../structures/Event');
const { getGuildData, getUserData } = require("../../utils/functions");

module.exports = class slashCreate extends Event {
	constructor(...args) {
		super(...args, {
			dirname: __dirname,
		});
	}

	async run(bot, interaction) {
		const guild = bot.guilds.cache.get(interaction.guildId)
		const guildId = interaction.guildId
		let cmd = bot.commands.get(interaction.commandName)
		let channel = guild.channels.cache.get(interaction.channelId)
		let member = guild.members.cache.get(interaction.user.id)

		let settings = await getGuildData(bot, guildId)
		if (Object.keys(settings).length == 0) return;
		let usersettings = await getUserData(bot, guildId)
		if (Object.keys(usersettings).length == 0) return;

		// If interaction was ran outside of CustomChannel
		if (settings.CustomChannel && (cmd.conf.music && interaction.channelId !== settings.mChannelID)) {
			let embed = new MessageEmbed()
				.setColor(bot.config.colorOrange)
				.setDescription(`This command is restricted to <#${settings.mChannelID}>.`)

			return await bot.send(interaction, {
					embeds: [embed],
					ephemeral: true
				})
		}

		// If user is banned from using commands
		if (usersettings.guilds.includes(interaction.guildId)) {
			let embed = new MessageEmbed()
				.setColor(bot.config.colorOrange)
				.setDescription("You are banned from running commands in this server.")

			return await bot.send(interaction, {
				embeds: [embed],
				ephemeral: true
			})
		}

		// check permissions
		if (guild) {
			// check bot permissions
			const requiredPERMS = ["MANAGE_CHANNELS", "ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "CONNECT", "SPEAK", "USE_VAD", "MUTE_MEMBERS"]
			let PERMS = [];
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
				return await bot.send(interaction, {
					embeds: [embed],
					ephemeral: true
				})
			}

			// check user permissions
			let neededPermissions = [];
			cmd.conf.userPermissions.forEach((perm) => {
				if (!channel.permissionsFor(member).has(perm)) {
					neededPermissions.push(perm);
				}
			});

			// Display missing user permissions
			if (neededPermissions.length > 0) {
				let embed = new MessageEmbed()
					.setColor(bot.config.colorWrong)
					.setDescription(`You need \`${neededPermissions.join(", ")}\` permissions for that command.`)


				//CHANNEL SEND EMBED
				return await bot.send(interaction, {
					embeds: [embed],
					ephemeral: true
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
		
		if (timestamps.has(member.user.id)) {
			const expirationTime = timestamps.get(member.user.id) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = `00:01`; //timeLeft.toFixed(1)

				let embed = new MessageEmbed()
					.setColor(bot.config.colorOrange)
					.setDescription(`This command is on cooldown for another \`${timeLeft}\`.`)

				//CHANNEL SEND EMBED
				return await bot.send(interaction, {
					embeds: [embed],
					ephemeral: true
				})
			}
		}
		// Check if user can use premium commands
		if (cmd.conf.premiumOnly && !(settings.premium || settings.permpremium || usersettings.premium)) {
			let embed = new MessageEmbed()
				.setColor(bot.config.colorOrange)
				.setDescription("This server is not premium!")


			return await bot.send(interaction, {
				embeds: [embed],
				ephemeral: true
			})
		}
		// Check if user can run voterequireded commands
		if (cmd.conf.reqVote && !(settings.permvote || hasVoted)) {

			let voteonly = new MessageEmbed()
				.setColor(bot.config.colorOrange)
				.setDescription(`This command requires you to vote.\n[Click here](${bot.config.voteLink}) to vote and use this command for the next 12 hours.`)

			return await bot.send(interaction, {
				embeds: [embed],
				ephemeral: true
			})
		} 

		if (cmd.conf.music) {
			const player = bot.manager.players.get(interaction.guildId)
			if (cmd.conf.reqplayer) {
				if (!player) {
					let embed = new MessageEmbed()
						.setColor(bot.config.colorWrong)
						.setDescription(`The bot is currently not playing.`)

					return await bot.send(interaction, {
						embeds: [embed],
						ephemeral: true
					})
				}
			}
			if (cmd.conf.reqvc) {
				const {
					channel
				} = member.voice;
				if (!channel) {
					let embed = new MessageEmbed()
						.setColor(bot.config.colorOrange)
						.setDescription('You have to join a voice channel first.')

					return await bot.send(interaction, {
						embeds: [embed],
						ephemeral: true
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

		timestamps.set(interaction.user.id, now);
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
		return await cmd.callback(bot, interaction, guild, interaction.options, settings);
	}
};