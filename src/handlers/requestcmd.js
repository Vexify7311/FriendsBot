const { search } = require("../utils/functions");
const { MessageEmbed, Collection} = require("discord.js");

module.exports = async (bot, msg, settings, usersettings) => {
     if (msg.author.id === bot.user.id) return;
     if (msg.author.bot) {
          try {
               if (msg.deletable) msg.delete();
          } catch (error) {
               bot.logger.error(error.message)
          }
          return;
     }
     const args = msg.content.split(' ');
     const command = args.shift().slice(settings.prefix.length).toLowerCase();
     let cmd = bot.commands.get(command) || bot.commands.get(bot.aliases.get(command));

     if (!cmd && [`<@${bot.user.id}>`, `<@!${bot.user.id}>`].find(p => msg.content.startsWith(p))) {
          // check to see if user is using mention as prefix
          cmd = bot.commands.get(args[0]) || bot.commands.get(bot.aliases.get(args[0]));
          args.shift();
     }

     if (cmd) {
          msg.args = args;

          if (usersettings.guilds.includes(msg.guild.id)) {
               if (msg.deletable) msg.delete();
               return;
          }

          if (cmd.conf.premiumOnly && !settings.premium) {
               if (msg.deletable) msg.delete();
               return;
          }

          if (cmd.conf.ownerOnly && !bot.config.ownerId.includes(msg.author.id)) {
               if (msg.deletable) msg.delete();
               return;
          }

          if (msg.guild) {
               // check bot permissions
               const requiredPERMS = ["MANAGE_CHANNELS", "ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "CONNECT", "SPEAK", "USE_VAD", "MUTE_MEMBERS"]
               let PERMS = [];
               const guild = bot.guilds.cache.get(msg.guild.id)
               if (!guild.me.permissions.has(requiredPERMS)) {
                    requiredPERMS.forEach(perms => {
                         guild.me.permissions.has(perms)
                         if (guild.me.permissions.has(perms)) {
                              PERMS.push(`✅ ${perms}`)
                         } else {
                              PERMS.push(`❌ ${perms}`)
                         }
                    })
               }

               // DISPLAY MISSING BOT PERMISSIONS
               if (PERMS.length > 0) {
                    not_allowed = true;
                    let botPERMS = new MessageEmbed()
                         .setColor(bot.config.colorWrong)
                         .setTitle(`**I need the following permissions to fully function!**`)
                         .setDescription(`${PERMS.join("\n")}`)

                    //CHANNEL SEND EMBED
                    msg.channel.send({
                         embeds: [botPERMS]
                    }).then(m => {
                         setTimeout(() => m.delete(), bot.config.DeleteTimeout)
                    }).catch((err) => {
                         console.error(err)
                    })
               }

               // check user permissions
               let neededPermissions = [];
               cmd.conf.userPermissions.forEach((perm) => {
                    if (!msg.channel.permissionsFor(msg.member).has(perm)) {
                         neededPermissions.push(perm);
                    }
               });

               // Display missing user permissions
               if (neededPermissions.length > 0) {
                    not_allowed = true;
                    let userPERMS = new MessageEmbed()
                         .setColor(bot.config.colorWrong)
                         .setDescription(`You need \`${neededPermissions.join(", ")}\` permissions for that command.`)


                    //CHANNEL SEND EMBED
                    msg.channel.send({
                         embeds: [userPERMS]
                    }).then(m => {
                         setTimeout(() => m.delete(), bot.config.DeleteTimeout)
                    }).catch((err) => {
                         console.error(err)
                    })
               }
          }

          if (!bot.cooldowns.has(cmd.help.name)) {
               bot.cooldowns.set(cmd.help.name, new Collection());
          }

          const now = Date.now(),
               timestamps = bot.cooldowns.get(cmd.help.name),
               cooldownAmount = (cmd.conf.cooldown || 2000);

          if (timestamps.has(msg.author.id)) {
               const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

               if (now < expirationTime) {
                    const timeLeft = `00:01`; //timeLeft.toFixed(1)

                    console.log(timeLeft)
                    const userCOOLDOWN = new MessageEmbed()
                         .setColor(bot.config.colorWrong)
                         .setDescription(`This command is on cooldown for another \`${timeLeft}\`.`)

                    //CHANNEL SEND EMBED
                    return msg.channel.send({
                         embeds: [userCOOLDOWN]
                    }).then(m => {
                         setTimeout(() => m.delete(), bot.config.DeleteTimeout)
                    }).catch((err) => {
                         console.error(err)
                    })
               }
          }

          if (cmd.conf.music) {
               if (msg.deletable) msg.delete();
               const player = bot.manager.players.get(msg.guild.id)
               if (cmd.conf.reqplayer) {
                    if (!player) {
                         let embed = new MessageEmbed()
                              .setColor(bot.config.colorWrong)
                              .setDescription(`The bot is currently not playing.`)

                         return msg.channel.send({
                              embeds: [embed]
                         }).then(m => {
                              setTimeout(() => m.delete(), bot.config.DeleteTimeout)
                         }).catch((err) => {
                              console.error(err)
                         })
                    }
               }
               if (cmd.conf.reqvc) {
                    const {
                         channel
                    } = msg.member.voice;
                    if (!channel) {
                         let embed = new MessageEmbed()
                              .setColor(bot.config.colorOrange)
                              .setDescription('You have to join a voice channel first.')

                         return msg.channel.send({
                              embeds: [embed]
                         }).then(m => {
                              setTimeout(() => m.delete(), bot.config.DeleteTimeout)
                         }).catch((err) => {
                              console.error(err)
                         })
                    }
                    if (channel.id !== player.id) {
                         let embed = new MessageEmbed()
                              .setColor(bot.config.colorOrange)
                              .setDescription(`I'm already playing in a different voice channel!.`)

                         return msg.channel.send({
                              embeds: [embed]
                         }).then(m => {
                              setTimeout(() => m.delete(), bot.config.DeleteTimeout)
                         }).catch((err) => {
                              console.error(err)
                         })
                    }
               }
          }

          if (bot.config.debug) bot.logger.debug(`Command: ${cmd.help.name} was ran by ${msg.author.tag}${!msg.guild ? ' in DM\'s' : ` in guild: ${msg.guild.id}`}.`);
          cmd.run(bot, msg, settings);
          timestamps.set(msg.author.id, now);
          setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);
     } else {
          return await search(bot, msg, msg.content);
     }


}