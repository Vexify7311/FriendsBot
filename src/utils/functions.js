// REQUIRING MODULES
const {
	MessageEmbed
} = require('discord.js');
const { GuildSchema, userSchema } = require("../database/models")


// GuildDataFunctions
module.exports.createGuildData = createGuildData;
module.exports.removeGuildData = removeGuildData;
module.exports.removeGuildSettings = removeGuildSettings;
module.exports.getGuildData = getGuildData;
module.exports.updateGuildData = updateGuildData;


// UserDataFunctions
module.exports.createUserData = createUserData;
module.exports.removeUserData = removeUserData;
module.exports.getUserData = getUserData;
module.exports.updateUserData = updateUserData;
module.exports.pushUserGuilds = pushUserGuilds;


// MusicFunctions
module.exports.checkMusic = checkMusic;
module.exports.isrequestchannel = isrequestchannel;
module.exports.search = search;
module.exports.musicoff = musicoff;
module.exports.musicembed = musicembed;
module.exports.getduration = getduration;

// GuildDataFunctions
async function createGuildData(settings) {
	try {
		const newGuild = new GuildSchema(settings)
		return await newGuild.save(); 
	} catch (error) {
		return false;
	}
}
async function removeGuildData(guildId) {
	try {
		await GuildSchema.findOneAndRemove({
			guildID: guildId
		});
		return true;
	} catch (error) {
		return false;
	}
}
async function removeGuildSettings(guildId, settings) {
	try {
		await GuildSchema.findOneAndUpdate({
		    guildID: guildId
		}, {
		    guildID: guildId,
		    $unset: {
			   settings
		    }
		}, {
		  upsert: true,
		  new: true
		});
		return true;
	 } catch (error) {
		return false;
	 }
}
async function getGuildData(bot, guildId) {
	let settings = await GuildSchema.findOne({
		guildID: guildId
	})

	if (!settings) {
		settings = bot.config.defaultSettings
		settings.guildID = guildId
	}
	return settings;
}
async function updateGuildData(guildId, settings) {
	try {
		await GuildSchema.findOneAndUpdate({
			guildID: guildId
		},
		settings, {
			upsert: true
		});
		return true;
	} catch (error) {
		return false;
	}
}

// UserDataFunctions
async function createUserData(settings) {
	try {
		const newUser = new userSchema(settings)
		return await newUser.save(); 
	} catch (error) {
		return false;
	}
}
async function removeUserData(userId) {
	try {
		await userSchema.findOneAndRemove({
			userID: userId
		});
		return true;
	} catch (error) {
		return false;
	}
}
async function getUserData(bot, userId) {
	let setting = await userSchema.findOne({
		userID: userId
	})

	if (!setting) {
		setting = bot.config.defaultUserSettings
		setting.userID = userId
	}
	return setting;
}
async function updateUserData(userId, settings) {
	try {
		await userSchema.findOneAndUpdate({
			userID: userId
		},
		settings, {
			upsert: true
		});
		return true;
	} catch (error) {
		return false;
	}
}
async function pushUserGuilds(userId, guildId) {
	try {
		await userSchema.findOneAndUpdate({
			userID: userId,
		}, {
			$push: {
				guilds: guildId
			},
		}, {
			upsert: true
		});
		return true;
	} catch(error) {
		return false;
	}
}

// MusicFunctions
async function checkMusic(member, bot, guildId) {
	let settings;
	try {
		settings = await getGuildData(guildId)
	} catch (error) {
		return false;
	}
	// Check if the member has role to interact with music plugin
	if (member.guild.roles.cache.get(settings.MusicDJRole)) {
		if (!member.roles.cache.has(settings.MusicDJRole)) {
			return false;
		}
	}

	// Check that a song is being played
	const player = bot.manager.players.get(member.guild.id);
	if (!player) return false;

	// Check that user is in the same voice channel
	if (member.voice.channel.id !== player.voiceChannel) return false;

	return true;
}
async function isrequestchannel(bot, channelid, guildId) {
	let settings = await getGuildData(bot, guildId)
	if (settings.CustomChannel) {
		try {
			if (channelid === settings.mChannelID) {
				return true;
			} else {
				return false;
			}
		} catch {
			return false;
		}
	} else {
		return false;
	}
}
async function search(bot, msg, search) {
	let player;
	try {
		player = bot.manager.create({
			guild: msg.guild.id,
			voiceChannel: msg.member.voice.channel.id,
			textChannel: msg.channel.id,
			selfDeafen: true,
		});
	} catch (err) {
		bot.logger.error(err.msg);
	}
	if (search.length == 0) {
		// Check if a file was uploaded to play instead
		const fileTypes = ['mp3', 'mp4', 'wav', 'm4a', 'webm', 'aac', 'ogg'];
		if (msg.attachments.size > 0) {
			const url = msg.attachments.first().url;
			for (let i = 0; i < fileTypes.length; i++) {
				if (url.endsWith(fileTypes[i])) {
					searchpush(url);
				}
			}
			if (!search) {
				if (msg.deletable) return msg.delete();
			}
		} else {
			if (msg.deletable) return msg.delete();
		}
	}
	if (player.state !== "CONNECTED") {
		player.connect();
	}
	//if ()
	if (msg.deletable) msg.delete();

	bot.manager.search(search, msg.author).then(async res => {
		const track = res.tracks[0]

		switch (res.loadType) {
			case 'NO_MATCHES':
				const nores = new MessageEmbed()
					.setColor(bot.config.colorWrong)
					.setDescription("Could not find any songs.")

				return msg.channel.send({
					embeds: [nores]
				}).then(m => {
					setTimeout(() => m.delete(), bot.config.DeleteTimeout)
				}).catch((err) => {
					bot.logger.error(err)
				})
			case "TRACK_LOADED":
				bot.logger.log(`Track Loaded: ${track.title}`)
				player.queue.add(track)

				if (!player.playing && !player.paused && !player.queue.size) player.play();

				return await musicembed(bot, player, msg.guild.id);
			case "SEARCH_RESULT":
				bot.logger.log(`Found Track: ${track.title}`)
				player.queue.add(track)

				if (!player.playing && !player.paused && !player.queue.size) player.play();

				return await musicembed(bot, player, msg.guild.id);
			case "PLAYLIST_LOADED":
				var PLAYLIST_LOADED;
				if (search.includes("&list=RD")) {
					PLAYLIST_LOADED = new MessageEmbed()
						.setColor(bot.guilds.cache.get(player.guild).members.cache.get(bot.user.id).displayHexColor)
						.setDescription(`1 track queued from: \`${res.playlist.name}\``)

					player.queue.add(res.tracks[0])

					if (!player.playing && !player.paused && !player.queue.size) player.play();
					await musicembed(bot, player, msg.guild.id);
				} else {
					PLAYLIST_LOADED = new MessageEmbed()
						.setColor(bot.guilds.cache.get(player.guild).members.cache.get(bot.user.id).displayHexColor)
						.setDescription(`${res.tracks.length} tracks queued from: ` + `\`${res.playlist.name}\``)

					player.queue.add(res.tracks);

					if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play();
					await musicembed(bot, player, msg.guild.id);
				}
				return msg.channel.send({
					embeds: [PLAYLIST_LOADED]
				}).then(m => {
					setTimeout(() => m.delete(), bot.config.DeleteTimeout)
				}).catch((err) => {
					console.error(err)
				})
		}
	});
}
async function musicoff(bot, guildId) {
	let settings = await getGuildData(bot, guildId)
	const channelid = settings.mChannelID
	const embedid = settings.mChannelEmbedID
	const MUSIC_OFF = new MessageEmbed()
		.setColor(bot.config.color)
		.setTitle("**No song playing currently**")
		.setDescription(`[Support](${bot.config.SupportServer.link}) | [Invite](${bot.config.inviteLink})`)
		.setFooter(`Prefix for this server is: ${settings.prefix}`)
		.setImage(bot.config.moody_no_music)

	const channel = await bot.channels.fetch(channelid);
	const embed = await channel.messages.fetch(embedid);

	embed.edit({
		content: `‏‏‎ \n__**Queue list:**__\nJoin a voice channel and queue songs by name or url in here.`,
		embeds: [MUSIC_OFF],
		allowedMentions: {
			repliedUser: false,
			parse: ["everyone"]
		}
	})
}
async function musicembed(bot, player, guildId) {
	let settings = await getGuildData(bot, guildId)
	const channelid = settings.mChannelID
	const embedid = settings.mChannelEmbedID
	const requester = settings.Requester

	if (!player) return await musicoff(bot, guildId)
	const queue = player.queue
	const track = player.queue.current
	const multiple = 15;
	const page = 1
	const end = page * multiple;
	const start = end - multiple;
	const tracksnormal = queue.slice(start, end);
	const tracks = tracksnormal.reverse()
	const queueLength = queue.length
	let queueArray;

	let thumbnail = `https://img.youtube.com/vi/` + track.identifier + `/sddefault.jpg`

	let volume = `${player.volume}%`

	let Footer = `${queue.length || "0"} Songs in queue | Volume: ${volume}`


	if (player.queueRepeat === true) {
		if (player.paused === true) {
			Footer = `${queue.length || "0"} Songs in queue | Volume: ${volume} | Loop: queue | Song paused`
		} else {
			Footer = `${queue.length || "0"} Songs in queue | Volume: ${volume} | Loop: queue`
		}
	} else if (player.trackRepeat === true) {
		if (player.paused === true) {
			Footer = `${queue.length || "0"} Songs in queue | Volume: ${volume} | Loop: song | Song paused`
		} else {
			Footer = `${queue.length || "0"} Songs in queue | Volume: ${volume} | Loop: song`
		}
	} else if (player.trackRepeat === false && player.queueRepeat === false) {
		if (player.paused === true) {
			Footer = `${queue.length || "0"} Songs in queue | Volume: ${volume} | Song paused`
		} else {
			Footer = `${queue.length || "0"} Songs in queue | Volume: ${volume}`
		}
	}

	const channel = await bot.channels.fetch(channelid);
	const embed = await channel.messages.fetch(embedid);

	let color;
	if (bot.guilds.cache.get(player.guild).members.cache.get(bot.user.id).displayHexColor === "#000000") {
		color = bot.config.color
	} else {
		color = bot.guilds.cache.get(player.guild).members.cache.get(bot.user.id).displayHexColor
	}
	const MUSIC = new MessageEmbed()
		.setAuthor(`[${await getduration(track.duration)}] - ${track.title}`, bot.config.avatarURL, track.uri)
		.setImage(thumbnail)
		.setColor(color)
		.setFooter(Footer)

	if (requester) {
		MUSIC.setDescription(`Requested by: ${track.requester}`)
		queueArray = tracks.map((_, i, trackM) => `${trackM.length - i}. ${trackM[i].author} - ${trackM[i].title} [${getduration(trackM[i].duration)}] ~ <@${trackM[i].requester.id}>`).join("\n")
	} else {
		queueArray = tracks.map((_, i, trackM) => `${trackM.length - i}. ${trackM[i].author} - ${trackM[i].title} [${getduration(trackM[i].duration)}]`).join("\n")
	}

	if (queueLength > multiple) {
		return embed.edit({
			content: `‏‏‎‏‏‎ \n__**Queue list:**__\n\nAnd **${queueLength - multiple}** more...\n${queueArray}`,
			embeds: [MUSIC],
			allowedMentions: {
				repliedUser: false,
				parse: ["everyone"]
			},

		})
	}
	if (queueLength !== 0 && queueLength <= multiple) {
		return embed.edit({
			content: ` \n__**Queue list:**__\n${queueArray}`,
			embeds: [MUSIC],
			allowedMentions: {
				repliedUser: false,
				parse: ["everyone"]
			},
		})
	} else {
		return embed.edit({
			content: `‏‏‎‏‏‎ \n__**Queue list:**__\nJoin a voice channel and queue songs by name or url in here.`,
			embeds: [MUSIC],
			allowedMentions: {
				repliedUser: false,
				parse: ["everyone"]
			},
		})
	}
}

function getduration(duration) {
	seconds = Math.floor((duration / 1000) % 60),
	minutes = Math.floor((duration / (1000 * 60)) % 60),
	hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

	hours = (hours < 10) ? "0" + hours : hours;
	minutes = (minutes < 10) ? "0" + minutes : minutes;
	seconds = (seconds < 10) ? "0" + seconds : seconds;

	if (hours >= 1) {
		return hours + ":" + minutes + ":" + seconds;
	} else {
		return minutes + ":" + seconds;
	}
}