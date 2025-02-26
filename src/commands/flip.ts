import {
	CommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js'

import logger from '@logger'

import { addBalance, addGamble, checkBalance } from 'db'
import config from '@config'
import { upCase } from 'utils'

export default {
	data: new SlashCommandBuilder()
		.setName('flip')
		.setDescription('Flips a coin, you can bet on it.')
		.addStringOption(option =>
			option
				.setName('colour')
				.setDescription('Bet on red or black')
				.addChoices(
					{ name: 'red', value: 'red' },
					{ name: 'black', value: 'black' }
				)
				.setRequired(true)
		)
		.addIntegerOption(option =>
			option
				.setName('amount')
				.setDescription('Amount to bet')
				.setMinValue(1)
				.setRequired(true)
		),
	async execute(interaction: CommandInteraction) {
		logger.info('Gambling: coin flip')
		const balance = await checkBalance(interaction.user.id)
		// @ts-expect-error it works
		const bet = interaction.options.getInteger('amount') || 0
		// @ts-expect-error it works
		const choice = interaction.options.getString('colour')

		if (bet > balance) {
			await interaction.reply("Ha! You're too poor to make that bet.")
			return
		} else {
			const redOrBlack = Math.random() < 0.5 ? 'red' : 'black'
			const won = choice === redOrBlack
			const newBalance = await addBalance(interaction.user.id, won ? bet : -bet)
			const response = new EmbedBuilder()
				.setColor(redOrBlack === 'red' ? 'Red' : 'NotQuiteBlack')
				.setTitle(won ? 'You won!' : 'Ha! You lost!')
				.setDescription(
					`You bet ${bet} on ${choice} and the ball landed on ${redOrBlack}.`
				)
				.addFields(
					{
						name: 'Bet Amount',
						value: `${bet} ${config.get('currency.name')}`,
						inline: true,
					},
					{ name: 'Bet Colour', value: upCase(choice), inline: true },
					{ name: 'Actual Colour', value: upCase(redOrBlack), inline: true },
					{
						name: 'New balance',
						value: `${newBalance} ${config.get('currency.name')}`,
						inline: true,
					}
				)
				.setThumbnail(
					won
						? 'https://media.tenor.com/B85QfhcxFKMAAAAC/rat-spinning.gif'
						: 'https://cdn.discordapp.com/attachments/1117852257157906492/1119782228407361696/ezgif.com-gif-maker.gif'
				)
			await interaction.reply({ embeds: [response] })
			await addGamble(won ? bet : -bet)
		}
	},
}
