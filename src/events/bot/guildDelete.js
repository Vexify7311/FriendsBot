// Dependencies
const { MessageEmbed, MessageAttachment } = require('discord.js'),
	Event = require('../../structures/Event');

const { cross } = require("../../assets/json/emojis.json");
const { userSchema } = require('../../database/models');
const { removeGuildData } = require('../../utils/functions');
module.exports = class guildDelete extends Event {
	constructor(...args) {
		super(...args, {
			dirname: __dirname,
		});
	}

	// run event
	async run(bot, guild) {
		try {
			await removeGuildData(guild.id)
		} catch (error) {
			bot.logger.error(`Error trying to removed data from [${guild.id}]`)
		}
		const modChannel = await bot.channels.fetch(bot.config.SupportServer.GuildChannel).catch(() => bot.logger.error(`Error fetching logs channel`));
		
		const embed = new MessageEmbed()
			.setColor(bot.config.colorWrong)
			.setTitle(`${cross} Left Guild`)
			.addField(`GuildID`, `${guild.id ?? 'undefined'}`)
			.addField(`Owner`, `**ID**: ${guild.ownerId}`)
			.addField(`MemberCount`, `${guild?.memberCount ?? 'undefined'}`)
			.setTimestamp()
		
		try {
			modChannel.send({ embeds: [embed] })
			// LOOP THROUGH ALL USER SCHEMAS AND DELETE GUILD.ID
		} catch (error) {
			bot.logger.error(error)
		}
	}
};
