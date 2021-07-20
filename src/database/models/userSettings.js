const { Schema, model } = require('mongoose');

const userSchema = Schema({
	userID: { type: String, default: "none"},
	userNAME: { type: String, default: "none"},
	premium: { type: Boolean, default: false },
	premiumSince: { type: String, default: "0"},
	premiumUses: { type: Number, default: 0},
	// If the user is banned from using commands or not
	guilds: { type: Array, default: [] },
	// Will be used for the website
	Language: { type: String, default: 'en-US' },
});

module.exports = model('Users', userSchema);
