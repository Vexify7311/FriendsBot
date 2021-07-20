// Dependencies
const { MessageEmbed } = require("discord.js");
const Event = require('../../structures/Event');
const {
	musicembed,
	musicoff,
	getGuildData
} = require('../../utils/functions');

module.exports = class messageReactionAdd extends Event {
	constructor(...args) {
		super(...args, {
			dirname: __dirname,
		});
	}

	// run event
	async run(bot, reaction, user) {
		if (reaction.message.partials) await reaction.message.fetch()
		if (reaction.partial) await reaction.fetch()

		if (user.bot) return;

		if (!reaction.message.guild) return;

		let guild = reaction.message.guild
		let settings = await getGuildData(bot, guild.id)

		if (!settings.CustomChannel) return;
		const member = guild.members.cache.get(user.id)
		const me = guild.members.cache.get(bot.user.id)

		if (reaction.message.id !== settings.mChannelEmbedID) return;

		if (!member.voice.channel) return reaction.users.remove(member).catch((err) => {
			console.error(err)
		})
		if (!me.voice.channel) return reaction.users.remove(member).catch((err) => {
			console.error(err)
		})

		const MemberVC = member.voice.channel.id
		const MeVC = me.voice.channel.id


		if (MemberVC !== MeVC) return reaction.users.remove(member).catch((err) => {
			console.error(err)
		})

		const player = bot.manager.get(guild.id)
		const channel = reaction.message.channel

		reaction.users.remove(member).catch((err) => {
			console.error(err)
		})
		// console.log(player)
		if (!player) return reaction.users.remove(member).catch((err) => {
			console.error(err)
		})
		switch (reaction.emoji.name) {
			case "⏯️":
				if (!player.queue.current && player.queue.length === 0) return;

				if (player.paused === true) {
					player.pause(false)
					return await musicembed(bot, player, player.guild);
				}
				if (player.paused === false) {
					player.pause(true)
					return await musicembed(bot, player, player.guild);
				}
				break;
			case "⏹️":
				if (!player.queue.current && player.queue.length === 0) return;

				player.queue.clear()
				return player.stop()
			case "⏭️":
				if (!player.queue.current && player.queue.length === 0) return;

				return player.stop()
			case "🔄":
				if (!player.queue.current && player.queue.length === 0) return;

				if (player.trackRepeat === false && player.queueRepeat === false) {

					const QueueRepeatEmbed = new MessageEmbed()
						.setColor(bot.guilds.cache.get(guild.id).members.cache.get(bot.user.id).displayHexColor)
						.setDescription(`Looping the queue activated.`)

					player.setQueueRepeat(true)

					await musicembed(bot, player, player.guild);

					return channel.send({
						embeds: [QueueRepeatEmbed]
					}).then(m => {
						setTimeout(() => m.delete(), bot.config.DeleteTimeout)
					}).catch((err) => {
						console.error(err)
					});

				} else if (player.queueRepeat === true && player.trackRepeat === false) {

					const TrackRepeatEmbed = new MessageEmbed()
						.setColor(bot.guilds.cache.get(guild.id).members.cache.get(bot.user.id).displayHexColor)
						.setDescription(`Looping the current song enabled.`)

					player.setTrackRepeat(true)

					await musicembed(bot, player, player.guild);

					return channel.send({
						embeds: [TrackRepeatEmbed]
					}).then(m => {
						setTimeout(() => m.delete(), bot.config.DeleteTimeout)
					}).catch((err) => {
						console.error(err)
					});

				} else if (player.trackRepeat === true && player.queueRepeat === false) {

					const NoRepeatEmbed = new MessageEmbed()
						.setColor(bot.guilds.cache.get(guild.id).members.cache.get(bot.user.id).displayHexColor)
						.setDescription(`Looping disabled.`)

					player.setTrackRepeat(false)

					await musicembed(bot, player, player.guild);

					return channel.send({
						embeds: [NoRepeatEmbed]
					}).then(m => {
						setTimeout(() => m.delete(), bot.config.DeleteTimeout)
					}).catch((err) => {
						console.error(err)
					});
				}
				return;
			case "🔀":
				if (!player.queue.current && player.queue.length === 0) return;

				player.queue.shuffle()

				return await musicembed(bot, player, player.guild)
			case "⭐":
				if (!player.queue.current && player.queue.length === 0) return;

				return;
			case "❌":
				if (!player.queue.current && player.queue.length === 0) return;

				return;
		}
	}
};