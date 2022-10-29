const { Client, Collection, GatewayIntentBits, TextChannel, EmbedBuilder} = require('discord.js');
const { prefix} = require('../config.json');
const { Player, QueryType } = require('discord-player');
const { play } = require('./play');

function getRandom(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
};


async function execute(client, message) {
    const args = message.content.split(" ");
    if (message.member.voiceStates == 'undefined')
        return message.channel.send('你又不在語音頻道>:(');
    
    const queue = await client.player.createQueue(message.guild.id);
    if(!queue.connection) await queue.connect(message.member.voice.channel)

    let embed = new EmbedBuilder();

    if(args[1].includes('https://')){

        // play list
        if(args[1].includes('list')){
            let url = args[1];
            const result = await client.player.search(url, {
                requestedBy: message.author,
                searchEngine: QueryType.YOUTUBE_PLAYLIST
            });
            if (result.tracks.length === 0)
                return message.channel.send('沒找到東東餒');
            
            const playlist = result.playlist;
            await queue.addTracks(result.tracks);
            embed
                .setDescription(`**[${playlist.title}](${playlist.url})**中有${result.tracks.length}首歌已加入播放列表`);
        }

        // play single song
        else {
            let url = args[1];
            const result = await client.player.search(url, {
                requestedBy: message.author,
                searchEngine: QueryType.YOUTUBE_VIDEO
            });
            if (result.tracks.length === 0)
                return message.channel.send('沒找到東東餒');
            
            const song = result.tracks[0];
            await queue.addTrack(song);
            embed
                .setDescription(`**[${song.title}](${song.url})** 已加入播放列表`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `歌曲時長: ${song.duration}` });
        }
    }

    // search song 
    else {
        let url = args[1];
        const result = await client.player.search(url, {
            requestedBy: message.author,
            searchEngine: QueryType.AUTO
        });
        if (result.tracks.length === 0)
            return message.channel.send('沒找到東東餒');
        
        const song = result.tracks[0];
        await queue.addTrack(song);
        embed
            .setDescription(`**[${song.title}](${song.url})** 已加入播放列表`)
            .setThumbnail(song.thumbnail)
            .setFooter({ text: `歌曲時長: ${song.duration}` });
    }
    if (!queue.playing) await queue.play();
    await message.channel.send({ embeds: [embed] });
}

async function queue(client, message) {
    const args = message.content.split(" ");
    const queue = client.player.getQueue(message.guild.id);
    if(!queue || !queue.playing){
        return await message.channel.send("播放清單沒東東欸");
    }

    const totalPages = Math.ceil(queue.tracks.length / 10) || 1;
    const page = (args[1] || 1) - 1;

    if (page > totalPages)
        return await message.channel.send('頁數好像怪怪ㄉ欸');
    
    const queueString = queue.tracks.slice(page*10, page*10+10).map((song, i) => {
        return `**${page*10+i+1}**. \`[${song.duration}]\` ${song.title} -- <@${song.requestedBy.id}>`;
    }).join("\n")

    const currentSong = queue.current;

    await message.channel.send({
        embeds: [
            new EmbedBuilder()
                .setDescription(`**目前播放**\n` + 
                (currentSong ? `\`[${currentSong.duration}]\` ${currentSong.title} -- <@${currentSong.requestedBy.id}>`: "None") +
                `\n\n**Queue**\n${queueString}`
                )
                .setFooter({
                    text: `第${page+1}頁，總共有${totalPages}頁`
                })
        ]
    })
    
}

async function quit(client, message) {
    const queue = client.player.getQueue(message.guild.id);

    if(!queue)
        return await message.channel.send("播放清單沒東東欸");
    queue.destroy();
    await message.channel.send('掰掰');

}

async function shuffle(client, message) {
    const queue = client.player.getQueue(message.guild.id);

    if(!queue)
        return await message.channel.send("播放清單沒東東欸");
    queue.shuffle();
    await message.channel.send('幫你把播放清單打亂了:D');

}

async function info(client, message) {
    const queue = client.player.getQueue(message.guild.id);

    if(!queue)
        return await message.channel.send("播放清單沒東東欸");
    
    let bar = queue.createProgressBar({
        queue: false,
        length: 19,
    })

    const song = queue.current;

    await message.channel.send({
        embeds: [
            new EmbedBuilder()
                .setThumbnail(song.thumbnail)
                .setDescription(`目前正在播放[${song.title}](${song.url})\n\n` + bar)
        ]
    })
}

async function pause(client, message) {
    const queue = client.player.getQueue(message.guild.id);

    if(!queue)
        return await message.channel.send("播放清單沒東東欸");
    queue.setPaused(true);
    await message.channel.send(`音樂已暫停，輸入${prefix}resume以繼續播放音樂。`);

}

async function resume(client, message) {
    const queue = client.player.getQueue(message.guild.id);

    if(!queue)
        return await message.channel.send("播放清單沒東東欸");
    queue.setPaused(false);
    await message.channel.send(`音樂已繼續播放。`);

}
async function skip(client, message) {
    const queue = client.player.getQueue(message.guild.id);

    if(!queue)
        return await message.channel.send("播放清單沒東東欸");

    const currentSong = queue.current;

    queue.skip();
    await message.channel.send({
        embeds: [
            new EmbedBuilder()
            
        ]
    });
}

async function jumpto(client, message) {
    const args = message.content.split(" ");
    const queue = client.player.getQueue(message.guild.id);
    
    if(!queue)
        return await message.channel.send("播放清單沒東東欸");

    const trackNum = args[1];
    if(trackNum > queue.tracks.length) return await message.channel.send('你的數字怪怪ㄉ欸')
    queue.skipTo(trackNum-1);
    await message.channel.send(`跳至第${trackNum}首`); 
}

async function help(client, message) {
    await message.channel.send({
        "embeds": [
            {
              "type": "rich",
              "title": `指令清單`,
              "color": 0x0793f1,
              "fields": [
                {
                  "name": `+help`,
                  "value": `顯示此清單`,
                  "inline": true
                },
                {
                  "name": `+ping`,
                  "value": `顯示延遲`
                },
                {
                  "name": `+play (你想放的音樂名稱、連結)`,
                  "value": `播放清單的連結也可以喔`
                },
                {
                  "name": `+queue`,
                  "value": `顯示目前的待播清單`
                },
                {
                  "name": `+quit`,
                  "value": `讓機器人離開語音頻道`
                },
                {
                  "name": `+shuffle`,
                  "value": `讓音樂清單隨機撥放`
                },
                {
                  "name": `+info`,
                  "value": `顯示目前播放的歌曲`
                },
                {
                  "name": `+pause`,
                  "value": `暫停音樂`
                },
                {
                  "name": `+resume`,
                  "value": `繼續播放音樂`
                },
                {
                  "name": `+skip`,
                  "value": `跳過目前的歌曲`
                },
                {
                  "name": `+jumpto (數字)`,
                  "value": `跳到指定歌曲`
                },
                {
                    "name": `/answer_me`,
                    "value": `奇怪的解答之書`
                  }
              ],
              "thumbnail": {
                "url": `https://i.imgur.com/IeQpJJw.png`,
                "height": 0,
                "width": 0
              },
              "author": {
                "name": `佑仔#8021`,
                "url": `https://twitter.com/yu_yutw`,
                "icon_url": `https://i.imgur.com/m2rX4dE.png`
              },
              "footer": {
                "text": `09/26/2022`,
                "icon_url": `https://i.imgur.com/IeQpJJw.png`
              }
            }
          ]
    });
}


const zapper = "833150206811439114";
module.exports = {
	msgDetect: (client, message) => {

        if (message.author.bot) return;

        if (message.content === '我好爛'){
            message.channel.send('電神又在騙');
        }
        const ratio = '的機率';
        if (message.content.includes(ratio)){
            message.channel.send(`${getRandom(1, 100)}%`)
        }
        // if (message.author.id === zapper){
        //     if(getRandom(1, 100)<20){
        //         message.react('⚡');
        //     } 
        // }

        if (message.content.startsWith(`${prefix}ping`)) {
            message.channel.send('測試中').then (async (msg) =>{
                msg.delete()
                message.channel.send(`Latency is ${msg.createdTimestamp - message.createdTimestamp}ms.\n API Latency is ${Math.round(client.ws.ping)}ms`);
              })
        }
        if (message.content.startsWith(`${prefix}play`)){
            execute(client, message);
            return;
        } else if (message.content.startsWith(`${prefix}queue`)){
            queue(client, message);
            return;
        } else if (message.content.startsWith(`${prefix}quit`)){
            quit(client, message);
            return;
        } else if (message.content.startsWith(`${prefix}shuffle`)){
            shuffle(client, message);
            return;
        } else if (message.content.startsWith(`${prefix}info`)){
            info(client, message);
            return;
        } else if (message.content.startsWith(`${prefix}pause`)){
            pause(client, message);
            return;
        } else if (message.content.startsWith(`${prefix}resume`)){
            resume(client, message);
            return;
        } else if (message.content.startsWith(`${prefix}skip`)){
            skip(client, message);
            return;
        } else if (message.content.startsWith(`${prefix}jumpto`)){
            jumpto(client, message);
            return;
        } else if (message.content.startsWith(`${prefix}help`)){
            help(client, message);
            return;
        }
    }
};