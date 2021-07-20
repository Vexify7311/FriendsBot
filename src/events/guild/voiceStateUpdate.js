// Dependencies
const { MessageEmbed } = require('discord.js');
const Event = require('../../structures/Event');
const { getGuildData } = require('../../utils/functions');

module.exports = class voiceStateUpdate extends Event {
	constructor(...args) {
		super(...args, {
			dirname: __dirname,
		});
	}

	// run event
	async run(bot, oldState, newState) {
		const channel = newState.guild.channels.cache.get(newState.channel?.id ?? newState.channelId);
		let settings = await getGuildData(bot, oldState.guild.id || newState.guild.id)
		var player = bot.manager.players.get(oldState.guild.id || newState.guild.id);
		if (newState.id === bot.user.id && oldState.serverDeaf === true && newState.serverDeaf === false) {
			try {
			    newState.setDeaf(true);
			    //return console.log(player.playing)
			    if (player.paused === true) return;
			    if (player.playing === true) {
				   setTimeout(() => {
					  player.pause(true)
					  setTimeout(() => {
						 player.pause(false)
					  }, bot.ws.ping * 2)
				   }, bot.ws.ping * 2)
			    }
			} catch (error) {
			    console.error(error)
			}
		 }
		 if (oldState.channelId && !newState.channelId) {
			try {
			    if (oldState.member.user.id === bot.user.id) {
				   var player = bot.manager.players.get(oldState.guild.id);
				   if (!player) return;
				   let settings = await getGuildData(bot, player.guild)
				   if (settings.CustomChannel) {
					  await musicoff(bot, player.guild).catch((err) => {
						 console.error(err)
					  });
					  return player.destroy()
				   } else {
					  player.destroy();
				   }
			    }
			} catch (err) {
			    console.error(err)
			}
		 }
	  
		var player = bot.manager.players.get(newState.guild.id);
		if (!player) return;
		if (!newState.guild.members.cache.get(bot.user.id).voice.channelId) player.destroy();
	
		if (newState.id == bot.user.id && channel?.type == 'GUILD_STAGE_VOICE') {
			if (!oldState.channelId) {
				try {
					await newState.guild.me.voice.setSuppressed(false).then(() => console.log(null));
				} catch (err) {
					player.pause(true);
				}
			} else if (oldState.suppress !== newState.suppress) {
				player.pause(newState.suppress);
			}
		}

		if (oldState.id === bot.user.id) return;
		if (!oldState.guild.members.cache.get(bot.user.id).voice.channelId) return;
	
	
		// Don't leave channel if 24/7 mode is active
		if (player.twentyFourSeven) return;

		if (oldState.guild.members.cache.get(bot.user.id).voice.channelId === oldState.channelId) {
			if (oldState.guild.voice?.channel && oldState.guild.voice.channel.members.filter(m => !m.user.bot).size === 0) {
				const vcName = oldState.guild.me.voice.channel.name;
				await delay(900000);

				// times up check if bot is still by themselves in VC (exluding bots)
				const vcMembers = oldState.guild.voice.channel.members.size;
				if (!vcMembers || vcMembers === 1) {
					const newPlayer = bot.manager.players.get(newState.guild.id);
					(newPlayer) ? player.destroy() : oldState.guild.voice.channel.leave();
					let embed = new MessageEmbed()
					// eslint-disable-next-line no-inline-comments
						.setColor(bot.config.colorOrange)
						.setDescription(`I left the voice cannel due to inactivity.\n If this is a [Premium](${bot.config.premiumLink}) server, you can disable the disconnect via \`${prefix}24/7\`.`)
					try {
						const c = bot.channels.cache.get(player.textChannel);
						if (c) return c.send({
							embeds: [embed]
						}).then(m => {
							setTimeout(() => m.delete(), bot.config.DeleteTimeout)
						}).catch((err) => {
							console.error(err)
						})
					} catch (err) {
						bot.logger.error(err.message);
					}
				}
			}
		}
	}
};