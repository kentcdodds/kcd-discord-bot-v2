import * as Discord from 'discord.js'
import * as Sentry from '@sentry/node'
import * as commands from './commands'
import * as reactions from './reactions'
import * as admin from './admin'
import {
	botLog,
	getBuildTimeInfo,
	getCommitInfo,
	getStartTimeInfo,
	typedBoolean,
} from './utils'

export async function start() {
	const client = new Discord.Client({
		intents: [
			Discord.GatewayIntentBits.Guilds,
			Discord.GatewayIntentBits.MessageContent,
			Discord.GatewayIntentBits.GuildMembers,
			Discord.GatewayIntentBits.GuildMessageReactions,
		],
	})

	client.on('ready', () => {
		Sentry.captureMessage('Client logged in.')
		// setup all parts of the bot here
		commands.setup(client)
		reactions.setup(client)
		admin.setup(client)

		const guild = client.guilds.cache.find(
			({ id }) => id === process.env.KCD_GUILD_ID,
		)
		if (guild && process.env.NODE_ENV === 'production') {
			void botLog(guild, () => {
				const commitInfo = getCommitInfo()
				const commitValue = commitInfo
					? [
							`author: ${commitInfo.author}`,
							`date: ${commitInfo.date}`,
							`message: ${commitInfo.message}`,
							`link: <${commitInfo.link}>`,
					  ].join('\n')
					: null
				return {
					title: '🤖 BOT Started',
					color: Discord.Colors.Green,
					description: `Logged in and ready to go. Here's some info on the running bot:`,
					fields: [
						{ name: 'Startup', value: getStartTimeInfo(), inline: true },
						{ name: 'Built', value: getBuildTimeInfo(), inline: true },
						commitValue ? { name: 'Commit', value: commitValue } : null,
					].filter(typedBoolean),
				}
			})
		}
	})

	Sentry.captureMessage('Logging in client')
	void client.login(process.env.DISCORD_BOT_TOKEN)

	return async function cleanup() {
		Sentry.captureMessage('Client logging out')
		client.destroy()
	}
}
