const fs = require('node:fs');
const path = require('node:path'); 
const { Client, Collection, GatewayIntentBits, TextChannel, ActivityType} = require('discord.js');
const { token} = require('./config.json');
const msg_cmd = require('./pre_command/message_commands');
const { Player, QueryType } = require('discord-player');
const cron = require('cron');


const client = new Client({
    'intents': [
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildBans,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates
    ]
});


client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25
    }
});

// const checkTime =  () => {
//     const nowTime = new Date().toISOString().
//     replace(/T/, ' ').
//     replace(/\..+/, '');
//     const args = nowTime.split(" ");
//     if(args[1]==='14:17:00'){
//         client.users.cache.get('338661569384808458').send('記得去跟電神請安');
//         console.log('成功提醒');
//     }
// }


for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log('Ready!');
    client.user.setPresence({
        activities: [{ name: `${client.guilds.cache.size} servers`, type: ActivityType.Listening }]
      });
      let scheduledMessage = new cron.CronJob('00 00 08 * * *', async () => {
        // This runs every day at 10:30:00, you can do anything you want
        // Specifing your guild (server) and your channel
        client.users.fetch('677885946829733889').then((user) => {
            user.send('記得去向智涵問安');
        })
        console.log('成功提醒');
        },{
            scheduled: true,
            timezone: 'Asia/Taipei'
    });
        let test = new cron.CronJob('00 30 11 * * *', async () => {
            client.users.fetch('338661569384808458').then((user) => {
                user.send('test');
            })
            console.log('成功提醒');
            }, undefined, true, "America/Los_Angeles");
        test.start();
              
          // When you want to start it, use:
        scheduledMessage.start()
});

client.on('messageCreate', message => {
    msg_cmd.msgDetect(client, message);
});

const readline = require('readline')
const rl = readline.createInterface({
    input: process.stdin
  });
rl.prompt();
rl.on("line", async (say) => {
    if(!say) return;
    const str = say.match(/^(\S+)\s(.*)/).slice(1);
    await client.channels.cache.get(str[0]).send(str[1]);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
    if(!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true});
    }
});


client.login(token);