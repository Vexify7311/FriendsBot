const {
     isrequestchannel, removeGuildSettings, getGuildData, updateGuildData
} = require("../../utils/functions");
const Event = require('../../structures/Event');
module.exports = class channelDelete extends Event {
     constructor(...args) {
          super(...args, {
               dirname: __dirname,
          });
     }
     async run(bot, channel) {
          var irc = await isrequestchannel(bot, channel.id, channel.guild.id)
          let settings = await getGuildData(bot, channel.guild.id)
          try {
               if (channel.type === "voice") {
                    if (channel.members.has(bot.user.id)) {
                         var player = bot.music.players.get(channel.guild.id)
                         if (!player) return;
                         if (channel.id === player.voiceChannel) {
                              if (irc) {
                                   await musicoff(bot, player, player.guild).catch((err) => {
                                        console.error(err)
                                   })
                                   return player.destroy()
                              } else {
                                   return player.destroy()
                              }
                         }
                    }
               }
               if (irc) {
                    var player = bot.manager.players.get(channel.guild.id)
                    let settingsREMOVE = {
                         CustomChannel: false,
                         mChannelID: "",
                         mChannelEmbedID: ""
                    }
                    if (!player) {
                         return await removeGuildSettings(channel.guild.id, settingsREMOVE);
                    } else {
                         await removeGuildSettings(channel.guild.id, settingsREMOVE);
                         let channeltosend;
                         let guild = channel.guild
                         guild.channels.cache.forEach((channel1) => {
                              if (channel1.type === "text" && !channeltosend && channel1.permissionsFor(guild.me).has("SEND_MESSAGES")) {
                                   channeltosend = channel1
                              }
                         });

                         if (!channeltosend) return;
                         player.setTextChannel(channeltosend)
                         return;
                    }
               }
          } catch (err) {
               console.error(err)
          }
     }
}