// Dependencies
const {
     Embed
} = require('../../utils'),
     Command = require('../../structures/Command.js');
const {
     MessageEmbed,
     Client
} = require("discord.js");
const discordTogether = require("../../DiscordTogether");

module.exports = class Youtube extends Command {
     constructor(bot) {
          super(bot, {
               name: 'youtube',
               helpPerms: "Everyone",
               dirname: __dirname,
               aliases: ['yt', 'together', 'yt2gether'],
               botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
               description: 'Lets you watch youtube together in discord.',
               cooldown: 2000,
               slash: true,
               usage: 'youtube <#channelmention>',
               options: [{
                    name: 'channel',
                    description: 'Channel in which you want to watch youtube.',
                    type: 'CHANNEL',
                    required: true,
               }],
          });
     }

     // Function for message command
     async run(bot, msg, settings) {
          const channelID = msg.args[0]
          const channel = await bot.channels.fetch(channelID)

          if (!channel?.id) {
               let embed = new MessageEmbed()
                    .setColor(bot.config.colorWrong)
                    .setDescription(`Invalid usage: \`${settings.prefix}youtube <channel-id>\``)

               return msg.channel.send({
                    embeds: [embed]
               }).then(m => {
                    setTimeout(() => m.delete(), bot.config.DeleteTimeout)
               }).catch((err) => {
                    console.error(err)
               })
          }

          
          let vcs = []
          msg.guild.channels.cache.forEach(x => {
               if (x.type == "GUILD_VOICE") {
                    vcs.push(`<#${x.id}>\n`)
               }
          })
          
          const vc = vcs.join("")

          if (channel.type !== 'GUILD_VOICE') {
               let embed = new MessageEmbed()
                    .setColor(bot.config.colorWrong)
                    .setDescription(`Please choose a \`VOICE CHANNEL\` like:\n${vc}`)

               return msg.channel.send({
                    embeds: [embed],
               }).then(m => {
                    setTimeout(() => m.delete(), bot.config.DeleteTimeout)
               }).catch((err) => {
                    console.error(err)
               })
          }
          discordTogether.createTogetherCode(channelID, 'youtube').then(async x => {
               let embed = new MessageEmbed()
                    .setColor(bot.guilds.cache.get(msg.guild.id).members.cache.get(bot.user.id).displayHexColor)
                    .setDescription(`[Klick here](${x.code}) to join the \`YouTube\` session!`)
                    .setFooter(`This message will be deleted in 1 hour!`)

               const t = await msg.channel.send({
                    embeds: [embed]
               })
               setTimeout(async () => t.delete(), 3600000)

          })

     }

     // Function for slash command
     async callback(bot, interaction, guild, args) {
          const channelID = args.get('channel')?.value;
          const channel = interaction.guild.channels.cache.get(channelID);

          let vcs = []

          interaction.guild.channels.cache.forEach(channel => {
               if (channel.type == "GUILD_VOICE") {
                    vcs.push(`<#${channel.id}>\n`)
               }
          });

          const vc = vcs.join("")
          if (channel.type !== 'GUILD_VOICE') {
               let embed = new MessageEmbed()
                    .setColor(bot.config.colorWrong)
                    .setDescription(`Please choose a \`VOICE CHANNEL\` like:\n${vc}`)

               return bot.send(interaction, {
                    embeds: [embed],
                    ephemeral: true
               })
          }

          discordTogether.createTogetherCode(channelID, 'youtube').then(async x => {
               let embed = new MessageEmbed()
                    .setColor(bot.guilds.cache.get(guild.id).members.cache.get(bot.user.id).displayHexColor)
                    .setDescription(`[Klick here](${x.code}) to join the \`YouTube\` session!`)
                    .setFooter(`This message will be deleted in 1 hour!`)

               const reply = await interaction.reply({ embeds: [embed], fetchReply: true});
               console.log(interaction)
               setTimeout(async () => {
                    const message = await interaction.channel?.messages.fetch(reply.id);
                    await message?.delete();
               }, 1000 * 60 * 60);
          })
     }
};