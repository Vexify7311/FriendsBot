let {
	Manager
} = require('erela.js'),
	Deezer = require('erela.js-deezer'),
	Spotify = require('erela.js-spotify'),
	Facebook = require('erela.js-facebook'), {
		MessageEmbed
	} = require('discord.js')
let {
	musicembed,
	musicoff,
	getGuildData
} = require('../utils/functions');
require('../structures/Player');

module.exports = (bot) => {
	let clientID = bot.config.api_keys.spotify.iD;
	let clientSecret = bot.config.api_keys.spotify.secret;
	let host = bot.config.lavalink.host;
	let port = bot.config.lavalink.port;
	let password = bot.config.lavalink.password;
	bot.manager = new Manager({
			//secure: true
			nodes: [{
				host: host,
				port: port,
				password: password
			}, ],
			plugins: [
				new Spotify({
					clientID,
					clientSecret
				}),
				new Deezer(),
				new Facebook(),
			],
			autoPlay: true,
			send(id, payload) {
				let guild = bot.guilds.cache.get(id);
				if (guild) guild.shard.send(payload);
			},
		})
		.on('nodeConnect', node => bot.logger.ready(`Lavalink node: ${node.options.identifier} has connected.`))
		.on('nodeDisconnect', (node, reason) => bot.logger.error(`Lavalink node: ${node.options.identifier} has disconnect, reason: ${(reason.reason) ? reason.reason : 'unspecified'}.`))
		.on('nodeError', (node, error) => bot.logger.error(`Lavalink node: '${node.options.identifier}', has error: '${error.message}'.`))
		.on('playerCreate', player => {
			if (bot.config.debug) bot.logger.log(`Lavalink player created in guild: ${player.guild}.`);
			var guild = bot.guilds.cache.get(player.guild);
			guild.me.voice.setDeaf(true).catch((err) => {
				console.error(err)
			});
		})
		.on('playerDestroy', async player => {
			if (bot.config.debug) bot.logger.log(`Lavalink player destroyed in guild: ${player.guild}.`);
		})
		.on('trackStart', async (player, track) => {
			let guild = bot.guilds.cache.get(player.guild);
			let settings = await getGuildData(bot, player.guild)
			var title = track.title;
			var url = track.uri;
			if (Object.keys(settings).length == 0) return;

			if (settings.CustomChannel) {
				return await musicembed(bot, player, guild.id);
			}
			if (settings.Announce) {
				let embed = new MessageEmbed()
					.setColor(bot.guilds.cache.get(player.guild).members.cache.get(bot.user.id).displayHexColor)
					.setTitle(`Now Playing`)
					.setDescription(`[${title}](${url})`)

				let channel = await bot.channels.fetch(player.textChannel)
				if (channel) channel.send({
					embeds: [embed]
				});
				if (settings.DelAnnounce) {
					setTimeout(() => {
						embedtbdel.delete(), (track.duration < 6.048e+8) ? track.duration : 60000
					});
				}
			}

			// clear timeout (for queueEnd event)
			if (player.timeout != null) return clearTimeout(player.timeout);
			return;
		})
		.on('trackEnd', async (player, track) => {
			// when track finishes add to previous songs array
			player.addPreviousSong(track);
		})
		.on('trackError', async (player, track, payload) => {
			// when a track causes an error
			if (bot.config.debug) bot.logger.log(`Track error: ${payload.error} in guild: ${player.guild}.`);

			// reset player filter (might be the cause)
			player.resetFilter();
		})
		.on('queueEnd', async (player) => {
			// When the queue has finished

			let settings = await getGuildData(bot, player.guild)

			if (settings.CustomChannel) {
				await musicoff(bot, player.guild);
			}

			player.timeout = setTimeout(async () => {
				// Don't leave channel if 24/7 mode is active
				if (player.twentyFourSeven) return;

				player.destroy();
			}, 180000);
			return;
		})
		.on('playerMove', async (player, oldChannel, newChannel) => {
			// Voice channel updated
			if (oldChannel === newChannel) return;
			let settings = await getGuildData(bot, player.guild);
			if (Object.keys(settings).length == 0) return;

			if (!newChannel) {
				if (!settings.CustomChannel) {
					return player.destroy();
				} else {
					await musicoff(bot, player.guild);
					player.destroy();
				}
			} else {
				//console.log(player)
				player.setVoiceChannel(newChannel);
				if (player.state !== "CONNECTED") player.connect();

				if (player.paused === true) {
					setTimeout(() => {
						player.pause(true);
						setTimeout(() => {
							player.pause(false);
						}, bot.ws.ping)
					}, bot.ws.ping);
				} else {
					return;
				}
			}
		});
};