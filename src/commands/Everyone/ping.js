// Dependencies
const {
     Embed
} = require('../../utils'),
     Command = require('../../structures/Command.js');
const {
     MessageEmbed
} = require("discord.js");

module.exports = class Ping extends Command {
     constructor(bot) {
          super(bot, {
               name: 'ping',
               helpPerms: "Everyone",
               dirname: __dirname,
               aliases: ['latency', 'test'],
               botPermissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
               description: 'Shows the latency of the bot.',
               cooldown: 2000,
               slash: true,
               usage: 'ping',
               options: [{
                    name: 'type',
                    description: 'Shows the latency of the bot.',
                    type: 'STRING',
                    required: false,
                    choices: [{
                              name: 'ws',
                              value: 'ws',
                         },
                         {
                              name: 'rest',
                              value: 'rest',
                         },
                    ],
               }],
               methods: [{
                         name: 'ws',
                         description: 'Shows the websocket latency of the bot.',
                         perms: "Everyone"
                    },
                    {
                         name: 'rest',
                         description: 'Shows the rest latency of the bot.',
                         perms: "Everyone"
                    }
               ],
          });
     }

     // Function for message command
     async run(bot, msg) {

          let Ping = new MessageEmbed()

          if (!msg.args[0] || msg.args[0].toLowerCase() === "ws") {
               if (Math.round(bot.ws.ping) < 100) {
                    Ping.setColor("#00FF55")
                    Ping.setDescription(`🟢 \`${Math.round(bot.ws.ping)} ms\``)
               } else if (Math.round(bot.ws.ping) >= 100 && Math.round(bot.ws.ping) <= 299) {
                    Ping.setColor("#FFD800")
                    Ping.setDescription(`🟠 \`${Math.round(bot.ws.ping)} ms\``)
               } else if (Math.round(bot.ws.ping) > 300) {
                    Ping.setColor("#FF3A00")
                    Ping.setDescription(`🔴 \`${Math.round(bot.ws.ping)} ms\``)
               }
               return msg.channel.send({
                    embeds: [Ping]
               }).then(m => {
                    setTimeout(() => m.delete(), bot.config.DeleteTimeout)
               }).catch((err) => {
                    console.error(err)
               })
          }
          if (msg.args[0].toLowerCase() === "rest") {
               if (Math.round(await bot.mongoose.ping()) < 100) {
                    Ping.setColor("#00FF55")
                    Ping.setDescription(`🟢 \`${Math.round(await bot.mongoose.ping())} ms\``)
               } else if (Math.round(await bot.mongoose.ping()) >= 100 && Math.round(await bot.mongoose.ping()) <= 299) {
                    Ping.setColor("#FFD800")
                    Ping.setDescription(`🟠 \`${Math.round(await bot.mongoose.ping())} ms\``)
               } else if (Math.round(await bot.mongoose.ping()) > 300) {
                    Ping.setColor("#FF3A00")
                    Ping.setDescription(`🔴 \`${Math.round(await bot.mongoose.ping())} ms\``)
               }
               return msg.channel.send({
                    embeds: [Ping]
               }).then(m => {
                    setTimeout(() => m.delete(), bot.config.DeleteTimeout)
               }).catch((err) => {
                    console.error(err)
               })
          }
     }

     // Function for slash command
     async callback(bot, interaction, guild, args) {

          let Ping = new MessageEmbed()
          const type = args.get('type')?.value;
          if (!type || type == "ws") {
               if (Math.round(bot.ws.ping) < 100) {
                    Ping.setColor("#00FF55")
                    Ping.setDescription(`🟢 \`${Math.round(bot.ws.ping)} ms\``)
               } else if (Math.round(bot.ws.ping) >= 100 && Math.round(bot.ws.ping) <= 299) {
                    Ping.setColor("#FFD800")
                    Ping.setDescription(`🟠 \`${Math.round(bot.ws.ping)} ms\``)
               } else if (Math.round(bot.ws.ping) > 300) {
                    Ping.setColor("#FF3A00")
                    Ping.setDescription(`🔴 \`${Math.round(bot.ws.ping)} ms\``)
               }
               await bot.send(interaction, {
                    embeds: [Ping]
               });

               setTimeout(async () => {
                    await interaction.deleteReply()
               }, bot.config.DeleteTimeout)

          }
          if (type == "rest") {
               if (Math.round(await bot.mongoose.ping()) < 100) {
                    Ping.setColor("#00FF55")
                    Ping.setDescription(`🟢 \`${Math.round(await bot.mongoose.ping())} ms\``)
               } else if (Math.round(await bot.mongoose.ping()) >= 100 && Math.round(await bot.mongoose.ping()) <= 299) {
                    Ping.setColor("#FFD800")
                    Ping.setDescription(`🟠 \`${Math.round(await bot.mongoose.ping())} ms\``)
               } else if (Math.round(await bot.mongoose.ping()) > 300) {
                    Ping.setColor("#FF3A00")
                    Ping.setDescription(`🔴 \`${Math.round(await bot.mongoose.ping())} ms\``)
               }
               await bot.send(interaction, {
                    embeds: [Ping]
               });


               setTimeout(async () => {
                    await interaction.deleteReply()
               }, bot.config.DeleteTimeout)
          }
     }
};