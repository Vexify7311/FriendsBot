// Dependencies
const { MessageEmbed } = require('discord.js');
const { Embed } = require('../../utils'),
	Command = require('../../structures/Command.js');
const { getGuildData } = require('../../utils/functions');

module.exports = class Help extends Command {
	constructor(bot) {
		super(bot, {
			name: 'help',
			helpPerms: "Everyone",
			aliases: ['h'],
			dirname: __dirname,
			botPermissions: [ 'SEND_MESSAGES', 'EMBED_LINKS'],
			description: 'Shows the help menu.	',
			usage:'help',
			cooldown: 2000,
			slash: true,
			options: [{
				name: 'command',
				description: 'Name of command to look up.',
				type: 'STRING',
				required: false,
			}],
		});
	}

	// Function for message command
	async run(bot, msg, settings) {
		const embed = await this.createEmbed(bot, msg.guild, msg.args[0], settings);
		msg.channel.send({ 
			embeds: [embed] 
		}).then(m => {
			setTimeout(() => m.delete(), 15000)
		}).catch((err) => {
			console.error(err)
		})
	}

	// Function for slash command
	async callback(bot, interaction, guild, args) {
		let settings = await getGuildData(bot, interaction.guildId);
		const channel = guild.channels.cache.get(interaction.channelId);
		const embed = await this.createEmbed(bot, guild, args.get('command')?.value, settings);
		await bot.send(interaction, { 
			embeds: [embed] 
		});

		setTimeout(async () => {
			await interaction.deleteReply()
		}, 15000)
	}

	// create Help embed
	async createEmbed(bot, guild, command, settings) {
		if (!command) {
			// Show default help page
			const embed = new MessageEmbed()
				.setColor(bot.config.color)
				.setAuthor("Help Command", bot.user.displayAvatarURL({ format: 'png' }))
				.setFooter(`Type '${settings.prefix}help <CommandName>' for details on a command`)
				
			const categories = bot.commands.map(c => c.help.category).filter((v, i, a) => settings.plugins.includes(v) && a.indexOf(v) === i);
			categories
				.sort((a, b) => a.category - b.category)
				.forEach(category => {
					const commands = bot.commands
						.filter(c => c.help.category === category)
						.sort((a, b) => a.help.name - b.help.name)
						.map(c => `\`${c.help.name}\``).join(', ');
					embed.addField(`${category} commands`, commands);
				});
			return embed;
		} else if (command) {
			// Check if arg is command
			if (bot.commands.get(command) || bot.commands.get(bot.aliases.get(command))) {
				// arg was a command
				const cmd = bot.commands.get(command) || bot.commands.get(bot.aliases.get(command));

				let aliases = cmd.help.aliases
				let flags = cmd.help.flags
				// Check if the command is allowed on the server
				if (settings.plugins.includes(cmd.help.category)) {
					const embed = new MessageEmbed()
						.setColor(bot.config.color)
						.setAuthor(`Help command: ${cmd.help.name}`, bot.user.displayAvatarURL({ format: 'png' }))
						.addField(`${settings.prefix}${cmd.help.usage}`, `${cmd.help.description}\n\`[${cmd.help.helpPerms}]\`\n‏‏‎ `)

					if (aliases.length > 0 && flags.length == 0) {
						embed.setDescription(`Aliases: \`${aliases.join('`, `')}\``)
					}
					if (aliases.length > 0 && flags.length > 0) {
						embed.setDescription(`Aliases: \`${aliases.join('`, `')}\`\nFlags: (-a = load all), (-n = play next), (-s = shuffle) \n\`${falgs.join('`, `')}\``)
					}
					if (cmd.help.methods.length > 0) {
						cmd.help.methods.forEach(x => {
							embed.addField(`${settings.prefix}${cmd.help.name} ${x.name}`, `${x.description}\n\`[${x.perms}]\`\n‏‏‎ `)
						})
					}
					return embed;
				} else {
					return;
				}
			} else {
				return;
			}
		} else {
			return;
		}
	}
};
