const { Schema, model } = require('mongoose');

const guildSchema = Schema({
	guildID: String,
	prefix: { type: String, default: require('../../config.js').defaultSettings.prefix },
	premium: { type: Boolean, default: false },
	Requester: { type: Boolean, default: true},
	Announce: { type: Boolean, default: true},
	DelAnnounce: { type: Boolean, default: false},
	Playlists: { type: Boolean, default: true},
	VCs: { type: Array, default: [] },
	// CUSTOM MUSIC CHANNEL OPTIONS
	CustomChannel: { type: Boolean, default: false},
	mChannelID: { type: String, default: "none" },
     mChannelEmbedID: { type: String, default: "none" },
	// MUSIC DJ
	MusicDJ: { type: Boolean, default: false },
	MusicDJRole: { type: String, default: '00' },
	// BOT LANGUAGE
	Language: { type: String, default: 'en-US' },
	// STUFF SO THAT BOT WORKS...
	plugins: { type: Array, default: ["Everyone", "DJ", "Admin", "Premium"] },
	version: { type: Number, default: require("../../config.js").defaultSettings.version},
});

module.exports = model('Guild', guildSchema);
