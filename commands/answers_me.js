const { SlashCommandBuilder } = require('discord.js');
const ans = require('./answer_book.json')

function getRandom(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('answer_me')
		.setDescription('Replies with an answer'),
	async execute(interaction) {
		await interaction.reply(ans[getRandom(1, 287)]);
	}
};