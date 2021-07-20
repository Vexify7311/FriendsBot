const { DiscordTogether } = require("discord-together")
let bot = require("./bot")
const discordTogether = new DiscordTogether(bot);

module.exports = discordTogether;