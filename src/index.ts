#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
	CampaignsResponse,
	formatCampaign,
	makeEmeliaRequest,
	setEmeliaApiKey,
	clearEmeliaApiKey,
	getEmeliaApiKey,
	EmeliaApiResponse,
} from './helpers.js'

const EMELIA_REST_API = 'https://api.emelia.io'

// Create server instance
const server = new McpServer({
	name: 'emelia',
	version: '1.0.0',
	capabilities: {
		resources: {},
		tools: {},
	},
})

// Authentication tool
server.tool(
	'authenticate',
	'Authenticate with Emelia API key',
	{
		api_key: z.string().describe('Your Emelia API key'),
	},
	async ({ api_key }) => {
		setEmeliaApiKey(api_key)

		return {
			content: [
				{
					type: 'text',
					text: 'Successfully authenticated with Emelia. Your API key has been securely stored for this session.',
				},
			],
		}
	}
)

// Logout tool
server.tool('logout', 'Clear stored Emelia API key', {}, async () => {
	clearEmeliaApiKey()

	return {
		content: [
			{
				type: 'text',
				text: 'Successfully logged out. Your API key has been cleared.',
			},
		],
	}
})

// Register emelia tools
server.tool(
	'get-campaigns',
	'Get Emelia campaigns list',
	{
		status: z
			.string()
			.optional()
			.describe('Status filter of the campaigns (Optional)'),
	},
	async ({ status }) => {
		// Check if user is authenticated
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let queryUrl = `${EMELIA_REST_API}/emails/campaigns`

		if (status) {
			queryUrl += `?status=${status}`
		}
		const campaignsData =
			await makeEmeliaRequest<CampaignsResponse>(queryUrl)

		if (!campaignsData) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve campaigns data',
					},
				],
			}
		}

		const campaigns = campaignsData.campaigns || []
		if (campaigns.length === 0) {
			return {
				content: [
					{
						type: 'text',
						text: `No active campaigns`,
					},
				],
			}
		}

		const formattedCampaigns = campaigns.map(formatCampaign)
		const campaignsText = `Campaigns list:\n\n${formattedCampaigns.join('\n')}`

		return {
			content: [
				{
					type: 'text',
					text: campaignsText,
				},
			],
		}
	}
)

// Create email campaign
server.tool(
	'create-email-campaign',
	'Create a new email campaign',
	{
		name: z.string().describe('Name of the campaign'),
	},
	async ({ name }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/emails/campaigns`,
			{
				method: 'POST',
				body: JSON.stringify({ name }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [{ type: 'text', text: 'Failed to create campaign' }],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Campaign "${name}" created successfully!`,
				},
			],
		}
	}
)

// Add contact to a campaign
server.tool(
	'add-contact-to-campaign',
	'Add a contact to an email campaign',
	{
		campaign_id: z.string().describe('Campaign ID'),
		email: z.string().email().describe('Contact email address'),
		first_name: z
			.string()
			.optional()
			.describe('Contact first name (Optional)'),
		last_name: z
			.string()
			.optional()
			.describe('Contact last name (Optional)'),
		custom_fields: z
			.record(z.string())
			.optional()
			.describe('Custom fields as key-value pairs (Optional)'),
	},
	async ({ campaign_id, email, first_name, last_name, custom_fields }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const contact = {
			email,
			firstName: first_name,
			lastName: last_name,
			...custom_fields,
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/emails/campaign/contacts`,
			{
				method: 'POST',
				body: JSON.stringify({ id: campaign_id, contact }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{ type: 'text', text: 'Failed to add contact to campaign' },
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Contact ${email} added to campaign successfully!`,
				},
			],
		}
	}
)

// Get campaign contacts
server.tool(
	'get-campaign-contacts',
	'Get contacts from an email campaign',
	{
		campaign_id: z.string().describe('Campaign ID'),
		page: z.number().default(1).describe('Page number'),
		per_page: z.number().default(10).describe('Contacts per page'),
		event: z
			.string()
			.optional()
			.describe(
				'Filter by event type (Optional): REPLIED, OPENED, CLICKED, BOUNCED, BLACKLISTED, UNSUBSCRIBED'
			),
		query: z.string().optional().describe('Search query (Optional)'),
	},
	async ({ campaign_id, page, per_page, event, query }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let apiUrl = `${EMELIA_REST_API}/emails/campaign/contacts?id=${campaign_id}&page=${page}&perPage=${per_page}`

		if (event) {
			apiUrl += `&event=${event}`
		}

		if (query) {
			apiUrl += `&query=${encodeURIComponent(query)}`
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(apiUrl)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve campaign contacts',
					},
				],
			}
		}

		const contacts =
			(response.contacts as Array<{
				email: string
				firstName?: string
				lastName?: string
				status?: string
			}>) || []
		if (contacts.length === 0) {
			return {
				content: [
					{
						type: 'text',
						text: 'No contacts found for this campaign',
					},
				],
			}
		}

		const contactsText = contacts
			.map((contact) => {
				return `Email: ${contact.email}${contact.firstName ? `, Name: ${contact.firstName} ${contact.lastName || ''}` : ''}${contact.status ? `, Status: ${contact.status}` : ''}`
			})
			.join('\n')

		const total = (response.total as number) || contacts.length
		return {
			content: [
				{
					type: 'text',
					text: `Campaign Contacts (Page ${page} of ${Math.ceil(total / per_page)}, Total: ${total}):\n\n${contactsText}`,
				},
			],
		}
	}
)

// Send test email
server.tool(
	'send-test-email',
	'Send a test email for a campaign',
	{
		campaign_id: z.string().describe('Campaign ID'),
		email: z.string().email().describe('Email to send the test to'),
		step: z
			.number()
			.min(0)
			.describe('Step index (0 = first step, 1 = second step, etc.)'),
		version: z
			.number()
			.min(0)
			.optional()
			.describe(
				'Version index for A/B testing (0 = A version, 1 = B version) (Optional)'
			),
	},
	async ({ campaign_id, email, step, version }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const payload: {
			campaignId: string
			email: string
			step: number
			version?: number
		} = {
			campaignId: campaign_id,
			email,
			step,
		}

		if (version !== undefined) {
			payload.version = version
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/emails/test`,
			{
				method: 'POST',
				body: JSON.stringify(payload),
			}
		)

		if (!response || !response.success) {
			return {
				content: [{ type: 'text', text: 'Failed to send test email' }],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Test email sent successfully to ${email}!`,
				},
			],
		}
	}
)

// Get campaign statistics
server.tool(
	'get-campaign-stats',
	'Get statistics for an email campaign',
	{
		campaign_id: z.string().describe('Campaign ID'),
		detailed: z
			.boolean()
			.default(false)
			.describe('Include detailed statistics'),
		start_date: z
			.string()
			.optional()
			.describe('Start date for filtering (ISO format) (Optional)'),
		end_date: z
			.string()
			.optional()
			.describe('End date for filtering (ISO format) (Optional)'),
		provider_id: z
			.string()
			.optional()
			.describe('Filter by email provider ID (Optional)'),
	},
	async ({ campaign_id, detailed, start_date, end_date, provider_id }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let apiUrl = `${EMELIA_REST_API}/stats?campaignId=${campaign_id}`

		if (detailed) {
			apiUrl += `&detailed=true`
		}

		if (start_date) {
			apiUrl += `&start=${encodeURIComponent(start_date)}`
		}

		if (end_date) {
			apiUrl += `&end=${encodeURIComponent(end_date)}`
		}

		if (provider_id) {
			apiUrl += `&providerId=${provider_id}`
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(apiUrl)

		if (!response) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve campaign statistics',
					},
				],
			}
		}

		// Format the statistics for better readability
		const globalStats = (response.global as Record<string, any>) || {}
		let statsText = 'Campaign Statistics:\n\n'

		statsText += 'Global Stats:\n'
		Object.entries(globalStats).forEach(([key, value]) => {
			statsText += `- ${key}: ${value}\n`
		})

		const steps = (response.steps as Array<Record<string, any>>) || []
		if (steps.length > 0) {
			statsText += '\nStep Stats:\n'
			steps.forEach((step, index) => {
				statsText += `\nStep ${index + 1}:\n`
				Object.entries(step).forEach(([key, value]) => {
					if (typeof value !== 'object') {
						statsText += `- ${key}: ${value}\n`
					}
				})
			})
		}

		return {
			content: [{ type: 'text', text: statsText }],
		}
	}
)

// Email verification tool
server.tool(
	'verify-email',
	'Verify if an email address is valid',
	{
		email: z.string().email().describe('Email address to verify'),
	},
	async ({ email }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/tools/verify/email`,
			{
				method: 'POST',
				body: JSON.stringify({ email }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to start email verification',
					},
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Email verification job started for ${email}. Job ID: ${response.jobId}\nUse the check-email-verification tool with this job ID to get the results.`,
				},
			],
		}
	}
)

// Check email verification status
server.tool(
	'check-email-verification',
	'Check the status of an email verification job',
	{
		job_id: z.string().describe('Job ID from the verify-email tool'),
	},
	async ({ job_id }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/tools/verify/email/${job_id}`
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve verification status',
					},
				],
			}
		}

		const data = (response.data as Record<string, any>) || {}

		let statusText = `Email Verification Status for ${data.email || 'unknown'}:\n`
		statusText += `Status: ${data.status || 'unknown'}\n`

		if (data.status === 'done') {
			statusText += `Result: ${data.qualification === 'valid' ? 'Valid email ✓' : 'Invalid email ✗'}\n`
		} else if (data.status === 'running') {
			statusText +=
				'The verification is still in progress. Please check again later.\n'
		} else if (data.status === 'error') {
			statusText += 'An error occurred during verification.\n'
		}

		if (data.date) {
			statusText += `Date: ${new Date(data.date).toLocaleString()}\n`
		}

		return {
			content: [{ type: 'text', text: statusText }],
		}
	}
)

// LinkedIn Campaign Operations
// Get LinkedIn campaigns
server.tool(
	'get-linkedin-campaigns',
	'Get LinkedIn campaigns list',
	{
		status: z
			.string()
			.optional()
			.describe('Status filter of the campaigns (Optional)'),
	},
	async ({ status }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let apiUrl = `${EMELIA_REST_API}/linkedin/campaigns`
		if (status) {
			apiUrl += `?status=${status}`
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(apiUrl)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve LinkedIn campaigns',
					},
				],
			}
		}

		const campaigns =
			(response.campaigns as Array<Record<string, any>>) || []
		if (campaigns.length === 0) {
			return {
				content: [
					{ type: 'text', text: 'No LinkedIn campaigns found' },
				],
			}
		}

		const campaignsText = campaigns
			.map((campaign) => {
				return `Campaign ID: ${campaign._id || '-'}\nName: ${campaign.name || '-'}\nStatus: ${campaign.status || '-'}\nAccount: ${campaign.account || '-'}\n---`
			})
			.join('\n')

		return {
			content: [
				{
					type: 'text',
					text: `LinkedIn Campaigns:\n\n${campaignsText}`,
				},
			],
		}
	}
)

// Create LinkedIn campaign
server.tool(
	'create-linkedin-campaign',
	'Create a new LinkedIn campaign',
	{
		name: z.string().describe('Name of the campaign'),
	},
	async ({ name }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/linkedin/campaigns`,
			{
				method: 'POST',
				body: JSON.stringify({ name }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to create LinkedIn campaign',
					},
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `LinkedIn campaign "${name}" created successfully!`,
				},
			],
		}
	}
)

// Add contact to LinkedIn campaign
server.tool(
	'add-contact-to-linkedin-campaign',
	'Add a contact to a LinkedIn campaign',
	{
		campaign_id: z.string().describe('LinkedIn campaign ID'),
		linkedin_url: z
			.string()
			.url()
			.describe('LinkedIn profile URL of the contact'),
		first_name: z
			.string()
			.optional()
			.describe('Contact first name (Optional)'),
		last_name: z
			.string()
			.optional()
			.describe('Contact last name (Optional)'),
		custom_fields: z
			.record(z.string())
			.optional()
			.describe('Custom fields as key-value pairs (Optional)'),
	},
	async ({
		campaign_id,
		linkedin_url,
		first_name,
		last_name,
		custom_fields,
	}) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const contact = {
			url: linkedin_url,
			firstName: first_name,
			lastName: last_name,
			...custom_fields,
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/linkedin/campaign/contacts`,
			{
				method: 'POST',
				body: JSON.stringify({ id: campaign_id, contact }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to add contact to LinkedIn campaign',
					},
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Contact with LinkedIn URL ${linkedin_url} added to campaign successfully!`,
				},
			],
		}
	}
)

// Get LinkedIn campaign contacts
server.tool(
	'get-linkedin-campaign-contacts',
	'Get contacts from a LinkedIn campaign',
	{
		campaign_id: z.string().describe('LinkedIn campaign ID'),
		page: z.number().default(1).describe('Page number'),
		per_page: z.number().default(10).describe('Contacts per page'),
		event: z
			.string()
			.optional()
			.describe(
				'Filter by event type (Optional): VISITED, INVITED, ACCEPTED, REPLIED, LIKED, MESSAGE_SENT'
			),
		query: z.string().optional().describe('Search query (Optional)'),
	},
	async ({ campaign_id, page, per_page, event, query }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let apiUrl = `${EMELIA_REST_API}/linkedin/campaign/contacts?id=${campaign_id}&page=${page}&perPage=${per_page}`

		if (event) {
			apiUrl += `&event=${event}`
		}

		if (query) {
			apiUrl += `&query=${encodeURIComponent(query)}`
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(apiUrl)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve LinkedIn campaign contacts',
					},
				],
			}
		}

		const contacts =
			(response.contacts as Array<{
				url: string
				firstName?: string
				lastName?: string
				status?: string
			}>) || []
		if (contacts.length === 0) {
			return {
				content: [
					{
						type: 'text',
						text: 'No contacts found for this LinkedIn campaign',
					},
				],
			}
		}

		const contactsText = contacts
			.map((contact) => {
				return `LinkedIn URL: ${contact.url}${contact.firstName ? `, Name: ${contact.firstName} ${contact.lastName || ''}` : ''}${contact.status ? `, Status: ${contact.status}` : ''}`
			})
			.join('\n')

		const total = (response.total as number) || contacts.length
		return {
			content: [
				{
					type: 'text',
					text: `LinkedIn Campaign Contacts (Page ${page} of ${Math.ceil(total / per_page)}, Total: ${total}):\n\n${contactsText}`,
				},
			],
		}
	}
)

// Remove contact from LinkedIn campaign
server.tool(
	'remove-contact-from-linkedin-campaign',
	'Remove a contact from a LinkedIn campaign',
	{
		campaign_id: z.string().describe('LinkedIn campaign ID'),
		linkedin_url: z
			.string()
			.url()
			.describe('LinkedIn URL of the contact to remove'),
	},
	async ({ campaign_id, linkedin_url }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/linkedin/campaign/contacts`,
			{
				method: 'DELETE',
				body: JSON.stringify({ id: campaign_id, url: linkedin_url }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to remove contact from LinkedIn campaign',
					},
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Contact with LinkedIn URL ${linkedin_url} removed from campaign successfully!`,
				},
			],
		}
	}
)

// Update LinkedIn contact custom field
server.tool(
	'update-linkedin-contact-field',
	'Update a custom field for a LinkedIn contact',
	{
		campaign_id: z.string().describe('LinkedIn campaign ID'),
		linkedin_url: z.string().url().describe('LinkedIn URL of the contact'),
		field_name: z.string().describe('Name of the custom field to update'),
		field_value: z.string().describe('New value for the custom field'),
	},
	async ({ campaign_id, linkedin_url, field_name, field_value }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/linkedin/contacts`,
			{
				method: 'PATCH',
				body: JSON.stringify({
					campaignId: campaign_id,
					url: linkedin_url,
					fieldName: field_name,
					fieldValue: field_value,
				}),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to update LinkedIn contact custom field',
					},
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Custom field "${field_name}" updated to "${field_value}" for contact with LinkedIn URL ${linkedin_url}`,
				},
			],
		}
	}
)

// Get LinkedIn campaign activities
server.tool(
	'get-linkedin-campaign-activities',
	'Get activities from a LinkedIn campaign',
	{
		campaign_id: z.string().describe('LinkedIn campaign ID'),
		contact_id: z
			.string()
			.optional()
			.describe('Filter by contact ID (Optional)'),
		type: z
			.string()
			.optional()
			.describe(
				'Filter by activity type (VISITED, INVITED, ACCEPTED, MESSAGE_SENT, REPLIED, RE_REPLY, FOLLOWED, LIKED) (Optional)'
			),
		page: z.number().default(1).describe('Page number (Optional)'),
		query: z.string().optional().describe('Search query (Optional)'),
	},
	async ({ campaign_id, contact_id, type, page, query }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let apiUrl = `${EMELIA_REST_API}/linkedin/campaigns/${campaign_id}/activities?page=${page}`

		if (contact_id) {
			apiUrl += `&contactId=${contact_id}`
		}

		if (type) {
			apiUrl += `&type=${type}`
		}

		if (query) {
			apiUrl += `&query=${encodeURIComponent(query)}`
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(apiUrl)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve LinkedIn campaign activities',
					},
				],
			}
		}

		const activities =
			(response.activities as Array<Record<string, any>>) || []
		if (activities.length === 0) {
			return {
				content: [
					{
						type: 'text',
						text: 'No activities found for this LinkedIn campaign',
					},
				],
			}
		}

		const activitiesText = activities
			.map((activity) => {
				const date = activity.date
					? new Date(activity.date).toLocaleString()
					: 'Unknown date'
				return `Event: ${activity.event || 'Unknown'}\nContact: ${activity.contact || 'Unknown'}\nDate: ${date}\n---`
			})
			.join('\n')

		return {
			content: [
				{
					type: 'text',
					text: `LinkedIn Campaign Activities:\n\n${activitiesText}`,
				},
			],
		}
	}
)

// Get LinkedIn campaign statistics
server.tool(
	'get-linkedin-campaign-stats',
	'Get statistics for a LinkedIn campaign',
	{
		campaign_id: z.string().describe('LinkedIn campaign ID'),
		detailed: z
			.boolean()
			.default(false)
			.describe('Include detailed statistics'),
		start_date: z
			.string()
			.optional()
			.describe('Start date for filtering (ISO format) (Optional)'),
		end_date: z
			.string()
			.optional()
			.describe('End date for filtering (ISO format) (Optional)'),
		account_id: z
			.string()
			.optional()
			.describe('Filter by LinkedIn account ID (Optional)'),
	},
	async ({ campaign_id, detailed, start_date, end_date, account_id }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let apiUrl = `${EMELIA_REST_API}/stats/linkedin?campaignId=${campaign_id}`

		if (detailed) {
			apiUrl += `&detailed=true`
		}

		if (start_date) {
			apiUrl += `&start=${encodeURIComponent(start_date)}`
		}

		if (end_date) {
			apiUrl += `&end=${encodeURIComponent(end_date)}`
		}

		if (account_id) {
			apiUrl += `&accountId=${account_id}`
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(apiUrl)

		if (!response) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve LinkedIn campaign statistics',
					},
				],
			}
		}

		// Format the statistics for better readability
		const globalStats = (response.global as Record<string, any>) || {}
		let statsText = 'LinkedIn Campaign Statistics:\n\n'

		statsText += 'Global Stats:\n'
		Object.entries(globalStats).forEach(([key, value]) => {
			statsText += `- ${key}: ${value}\n`
		})

		const steps = (response.steps as Array<Record<string, any>>) || []
		if (steps.length > 0) {
			statsText += '\nStep Stats:\n'
			steps.forEach((step, index) => {
				statsText += `\nStep ${index + 1}:\n`
				Object.entries(step).forEach(([key, value]) => {
					if (typeof value !== 'object') {
						statsText += `- ${key}: ${value}\n`
					}
				})
			})
		}

		return {
			content: [{ type: 'text', text: statsText }],
		}
	}
)

// Advanced Campaign Operations
// Create advanced campaign
server.tool(
	'create-advanced-campaign',
	'Create a new advanced campaign',
	{
		name: z.string().describe('Name of the campaign'),
	},
	async ({ name }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/advanced/campaigns`,
			{
				method: 'POST',
				body: JSON.stringify({ name }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to create advanced campaign',
					},
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Advanced campaign "${name}" created successfully! Campaign ID: ${response.campaignId}`,
				},
			],
		}
	}
)

// Get advanced campaigns
server.tool(
	'get-advanced-campaigns',
	'Get advanced campaigns list',
	{},
	async () => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/advanced/campaigns`
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve advanced campaigns',
					},
				],
			}
		}

		const campaigns =
			(response.campaigns as Array<Record<string, any>>) || []
		if (campaigns.length === 0) {
			return {
				content: [
					{ type: 'text', text: 'No advanced campaigns found' },
				],
			}
		}

		const campaignsText = campaigns
			.map((campaign) => {
				return `Campaign ID: ${campaign._id || '-'}\nName: ${campaign.name || '-'}\nStatus: ${campaign.status || '-'}\nCreated: ${campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : '-'}\n---`
			})
			.join('\n')

		return {
			content: [
				{
					type: 'text',
					text: `Advanced Campaigns:\n\n${campaignsText}`,
				},
			],
		}
	}
)

// Add contact to advanced campaign
server.tool(
	'add-contact-to-advanced-campaign',
	'Add a contact to an advanced campaign',
	{
		campaign_id: z.string().describe('Advanced campaign ID'),
		email: z
			.string()
			.email()
			.optional()
			.describe('Contact email address (Optional)'),
		linkedin_url: z
			.string()
			.url()
			.optional()
			.describe('LinkedIn profile URL of the contact (Optional)'),
		first_name: z
			.string()
			.optional()
			.describe('Contact first name (Optional)'),
		last_name: z
			.string()
			.optional()
			.describe('Contact last name (Optional)'),
		custom_fields: z
			.record(z.string())
			.optional()
			.describe('Custom fields as key-value pairs (Optional)'),
	},
	async ({
		campaign_id,
		email,
		linkedin_url,
		first_name,
		last_name,
		custom_fields,
	}) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		if (!email && !linkedin_url) {
			return {
				content: [
					{
						type: 'text',
						text: 'Either email or LinkedIn URL must be provided',
					},
				],
			}
		}

		const contact = {
			...(email && { email }),
			...(linkedin_url && { linkedinUrlProfile: linkedin_url }),
			...(first_name && { firstName: first_name }),
			...(last_name && { lastName: last_name }),
			...custom_fields,
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/advanced/campaign/contacts`,
			{
				method: 'POST',
				body: JSON.stringify({ id: campaign_id, contact }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to add contact to advanced campaign',
					},
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Contact added to advanced campaign successfully! Contact ID: ${response.contactId}`,
				},
			],
		}
	}
)

// Get advanced campaign contacts
server.tool(
	'get-advanced-campaign-contacts',
	'Get contacts from an advanced campaign',
	{
		campaign_id: z.string().describe('Advanced campaign ID'),
		page: z.number().default(1).describe('Page number'),
		per_page: z.number().default(10).describe('Contacts per page'),
		event: z
			.string()
			.optional()
			.describe('Filter by event type (Optional)'),
		query: z.string().optional().describe('Search query (Optional)'),
	},
	async ({ campaign_id, page, per_page, event, query }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let apiUrl = `${EMELIA_REST_API}/advanced/campaign/contacts?id=${campaign_id}&page=${page}&perPage=${per_page}`

		if (event) {
			apiUrl += `&event=${event}`
		}

		if (query) {
			apiUrl += `&query=${encodeURIComponent(query)}`
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(apiUrl)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve advanced campaign contacts',
					},
				],
			}
		}

		const contacts = (response.contacts as Array<Record<string, any>>) || []
		if (contacts.length === 0) {
			return {
				content: [
					{
						type: 'text',
						text: 'No contacts found for this advanced campaign',
					},
				],
			}
		}

		const contactsText = contacts
			.map((contact) => {
				let text = `Contact ID: ${contact.id || '-'}`
				if (contact.email) text += `\nEmail: ${contact.email}`
				if (contact.linkedinUrlProfile)
					text += `\nLinkedIn: ${contact.linkedinUrlProfile}`
				if (contact.firstName || contact.lastName)
					text +=
						`\nName: ${contact.firstName || ''} ${contact.lastName || ''}`.trim()
				if (contact.status) text += `\nStatus: ${contact.status}`
				text += '\n---'
				return text
			})
			.join('\n')

		const total = (response.total as number) || contacts.length
		return {
			content: [
				{
					type: 'text',
					text: `Advanced Campaign Contacts (Page ${page} of ${Math.ceil(total / per_page)}, Total: ${total}):\n\n${contactsText}`,
				},
			],
		}
	}
)

// Remove contact from advanced campaign
server.tool(
	'remove-contact-from-advanced-campaign',
	'Remove a contact from an advanced campaign',
	{
		campaign_id: z.string().describe('Advanced campaign ID'),
		contact_id: z.string().describe('ID of the contact to remove'),
	},
	async ({ campaign_id, contact_id }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/advanced/campaign/contacts`,
			{
				method: 'DELETE',
				body: JSON.stringify({
					id: campaign_id,
					contactId: contact_id,
				}),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to remove contact from advanced campaign',
					},
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Contact with ID ${contact_id} removed from advanced campaign successfully!`,
				},
			],
		}
	}
)

// Add contact to advanced list
server.tool(
	'add-contact-to-advanced-list',
	'Add a contact to an advanced list',
	{
		list_id: z.string().describe('Advanced list ID'),
		email: z
			.string()
			.email()
			.optional()
			.describe('Contact email address (Optional)'),
		linkedin_url: z
			.string()
			.url()
			.optional()
			.describe('LinkedIn profile URL of the contact (Optional)'),
		first_name: z
			.string()
			.optional()
			.describe('Contact first name (Optional)'),
		last_name: z
			.string()
			.optional()
			.describe('Contact last name (Optional)'),
		custom_fields: z
			.record(z.string())
			.optional()
			.describe('Custom fields as key-value pairs (Optional)'),
	},
	async ({
		list_id,
		email,
		linkedin_url,
		first_name,
		last_name,
		custom_fields,
	}) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		if (!email && !linkedin_url) {
			return {
				content: [
					{
						type: 'text',
						text: 'Either email or LinkedIn URL must be provided',
					},
				],
			}
		}

		const contact = {
			...(email && { email }),
			...(linkedin_url && { linkedinUrlProfile: linkedin_url }),
			...(first_name && { firstName: first_name }),
			...(last_name && { lastName: last_name }),
			...custom_fields,
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/advanced/lists/contacts`,
			{
				method: 'POST',
				body: JSON.stringify({ id: list_id, contact }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to add contact to advanced list',
					},
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Contact added to advanced list successfully! Contact ID: ${response.contactId}`,
				},
			],
		}
	}
)

// Get advanced campaign activities
server.tool(
	'get-advanced-campaign-activities',
	'Get activities from an advanced campaign',
	{
		campaign_id: z.string().describe('Advanced campaign ID'),
		contact_id: z
			.string()
			.optional()
			.describe('Filter by contact ID (Optional)'),
		type: z
			.string()
			.optional()
			.describe('Filter by activity type (Optional)'),
		page: z.number().default(1).describe('Page number (Optional)'),
		query: z.string().optional().describe('Search query (Optional)'),
	},
	async ({ campaign_id, contact_id, type, page, query }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let apiUrl = `${EMELIA_REST_API}/advanced/campaigns/${campaign_id}/activities?page=${page}`

		if (contact_id) {
			apiUrl += `&contactId=${contact_id}`
		}

		if (type) {
			apiUrl += `&type=${type}`
		}

		if (query) {
			apiUrl += `&query=${encodeURIComponent(query)}`
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(apiUrl)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve advanced campaign activities',
					},
				],
			}
		}

		const activities =
			(response.activities as Array<Record<string, any>>) || []
		if (activities.length === 0) {
			return {
				content: [
					{
						type: 'text',
						text: 'No activities found for this advanced campaign',
					},
				],
			}
		}

		const activitiesText = activities
			.map((activity) => {
				const date = activity.date
					? new Date(activity.date).toLocaleString()
					: 'Unknown date'
				return `Event: ${activity.event || 'Unknown'}\nContact: ${activity.contact || 'Unknown'}\nIdentity: ${activity.identity || 'Unknown'}\nDate: ${date}\n---`
			})
			.join('\n')

		return {
			content: [
				{
					type: 'text',
					text: `Advanced Campaign Activities:\n\n${activitiesText}`,
				},
			],
		}
	}
)

// Get advanced campaign statistics
server.tool(
	'get-advanced-campaign-stats',
	'Get statistics for an advanced campaign',
	{
		campaign_id: z.string().describe('Advanced campaign ID'),
		detailed: z
			.boolean()
			.default(false)
			.describe('Include detailed statistics'),
		start_date: z
			.string()
			.optional()
			.describe('Start date for filtering (ISO format) (Optional)'),
		end_date: z
			.string()
			.optional()
			.describe('End date for filtering (ISO format) (Optional)'),
	},
	async ({ campaign_id, detailed, start_date, end_date }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let apiUrl = `${EMELIA_REST_API}/stats/advanced?campaignId=${campaign_id}`

		if (detailed) {
			apiUrl += `&detailed=true`
		}

		if (start_date) {
			apiUrl += `&start=${encodeURIComponent(start_date)}`
		}

		if (end_date) {
			apiUrl += `&end=${encodeURIComponent(end_date)}`
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(apiUrl)

		if (!response) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve advanced campaign statistics',
					},
				],
			}
		}

		// Format the statistics for better readability
		const globalStats = (response.global as Record<string, any>) || {}
		let statsText = 'Advanced Campaign Statistics:\n\n'

		statsText += 'Global Stats:\n'
		Object.entries(globalStats).forEach(([key, value]) => {
			statsText += `- ${key}: ${value}\n`
		})

		const steps = (response.steps as Array<Record<string, any>>) || []
		if (steps.length > 0) {
			statsText += '\nStep Stats:\n'
			steps.forEach((step, index) => {
				statsText += `\nStep ${index + 1}:\n`
				Object.entries(step).forEach(([key, value]) => {
					if (typeof value !== 'object') {
						statsText += `- ${key}: ${value}\n`
					}
				})
			})
		}

		return {
			content: [{ type: 'text', text: statsText }],
		}
	}
)

// Email blacklist management
server.tool(
	'add-to-blacklist',
	'Add an email or domain to the blacklist',
	{
		email: z
			.string()
			.describe(
				'Email address or domain to blacklist (e.g., example@domain.com or domain.com)'
			),
	},
	async ({ email }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/emails/blacklists/contact`,
			{
				method: 'POST',
				body: JSON.stringify({ email }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [{ type: 'text', text: 'Failed to add to blacklist' }],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Successfully added ${email} to the blacklist`,
				},
			],
		}
	}
)

server.tool(
	'remove-from-blacklist',
	'Remove an email or domain from the blacklist',
	{
		email: z
			.string()
			.describe(
				'Email address or domain to remove from blacklist (e.g., example@domain.com or domain.com)'
			),
	},
	async ({ email }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/emails/blacklists/contact`,
			{
				method: 'DELETE',
				body: JSON.stringify({ email }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{ type: 'text', text: 'Failed to remove from blacklist' },
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Successfully removed ${email} from the blacklist`,
				},
			],
		}
	}
)

// Email finder tool
server.tool(
	'find-email',
	'Find email address of a person at a company',
	{
		fullname: z.string().describe('Full name of the person'),
		company_name: z.string().describe('Company name'),
		company_website: z
			.string()
			.optional()
			.describe('Company website (Optional)'),
		country: z
			.string()
			.optional()
			.describe('Country of the company (Optional)'),
	},
	async ({ fullname, company_name, company_website, country }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const payload = {
			fullname,
			companyName: company_name,
			...(company_website && { companyWebsite: company_website }),
			...(country && { country }),
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/tools/find/email`,
			{
				method: 'POST',
				body: JSON.stringify(payload),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{ type: 'text', text: 'Failed to start email finder job' },
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Email finder job started for ${fullname} at ${company_name}. Job ID: ${response.jobId}\nUse the check-email-finder tool with this job ID to get the results.`,
				},
			],
		}
	}
)

// Check email finder job status
server.tool(
	'check-email-finder',
	'Check the status of an email finder job',
	{
		job_id: z.string().describe('Job ID from the find-email tool'),
	},
	async ({ job_id }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/tools/find/email/${job_id}`
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve email finder status',
					},
				],
			}
		}

		const data = (response.data as Record<string, any>) || {}

		let statusText = `Email Finder Status for ${data.fullname || 'unknown'} at ${data.companyName || 'unknown'}:\n`
		statusText += `Status: ${data.status || 'unknown'}\n`

		if (data.status === 'done') {
			statusText += `Email: ${data.email || 'Not found'}\n`
			statusText += `Qualification: ${data.qualification === 'valid' ? 'Valid email ✓' : 'Invalid email ✗'}\n`
		} else if (data.status === 'running') {
			statusText +=
				'The email finder is still in progress. Please check again later.\n'
		} else if (data.status === 'error') {
			statusText += 'An error occurred during the email finder process.\n'
		}

		if (data.date) {
			statusText += `Date: ${new Date(data.date).toLocaleString()}\n`
		}

		return {
			content: [{ type: 'text', text: statusText }],
		}
	}
)

// Phone finder tool
server.tool(
	'find-phone',
	'Find phone number of a person using their LinkedIn profile',
	{
		linkedin_url: z.string().url().describe('LinkedIn URL of the person'),
	},
	async ({ linkedin_url }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/tools/find/phone`,
			{
				method: 'POST',
				body: JSON.stringify({ linkedinUrl: linkedin_url }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{ type: 'text', text: 'Failed to start phone finder job' },
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Phone finder job started for LinkedIn profile: ${linkedin_url}. Job ID: ${response.jobId}\nUse the check-phone-finder tool with this job ID to get the results.`,
				},
			],
		}
	}
)

// Check phone finder job status
server.tool(
	'check-phone-finder',
	'Check the status of a phone finder job',
	{
		job_id: z.string().describe('Job ID from the find-phone tool'),
	},
	async ({ job_id }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/tools/find/phone/${job_id}`
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve phone finder status',
					},
				],
			}
		}

		const data = (response.data as Record<string, any>) || {}

		let statusText = `Phone Finder Status for LinkedIn profile: ${data.linkedinUrl || 'unknown'}:\n`
		statusText += `Status: ${data.status || 'unknown'}\n`

		if (data.status === 'done') {
			statusText += `Phone Number: ${data.phoneNumber || 'Not found'}\n`
			if (data.country) {
				statusText += `Country: ${data.country}\n`
			}
			statusText += `Result: ${data.qualification === 'found' ? 'Phone found ✓' : 'Phone not found ✗'}\n`
		} else if (data.status === 'running') {
			statusText +=
				'The phone finder is still in progress. Please check again later.\n'
		} else if (data.status === 'error') {
			statusText += 'An error occurred during the phone finder process.\n'
		}

		if (data.date) {
			statusText += `Date: ${new Date(data.date).toLocaleString()}\n`
		}

		return {
			content: [{ type: 'text', text: statusText }],
		}
	}
)

// Email provider management
server.tool(
	'get-email-providers',
	'List email providers',
	{
		filter: z
			.string()
			.optional()
			.describe('Filter to show only disconnected providers (Optional)'),
	},
	async ({ filter }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		let apiUrl = `${EMELIA_REST_API}/email-providers`

		if (filter === 'disconnected') {
			apiUrl += `?filter=disconnected`
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(apiUrl)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to retrieve email providers',
					},
				],
			}
		}

		const providers =
			(response.providers as Array<Record<string, any>>) || []
		if (providers.length === 0) {
			return {
				content: [{ type: 'text', text: 'No email providers found' }],
			}
		}

		const providersText = providers
			.map((provider) => {
				return `Sender: ${provider.senderName || '-'} <${provider.senderEmail || '-'}>\nType: ${provider.emailType || '-'}\nStatus: ${provider.disconnected ? 'Disconnected' : 'Connected'}\n---`
			})
			.join('\n')

		return {
			content: [
				{ type: 'text', text: `Email Providers:\n\n${providersText}` },
			],
		}
	}
)

server.tool(
	'add-email-provider',
	'Add a new email provider',
	{
		sender_name: z.string().describe('Name displayed as sender'),
		sender_email: z
			.string()
			.email()
			.describe('Email address used for sending emails'),
		email_type: z
			.enum(['GOOGLE', 'OFFICE', 'EXCHANGE', 'SMTP', 'GOOGLEIMAP'])
			.describe('Type of email provider'),
		sender_password: z
			.string()
			.optional()
			.describe(
				'Password for the email account (required for some provider types)'
			),
		smtp_config: z
			.object({
				login: z.string(),
				password: z.string(),
				server: z.string(),
				port: z.number(),
				ssl: z.boolean().default(true),
			})
			.optional()
			.describe('SMTP configuration (required for SMTP type)'),
		imap_config: z
			.object({
				login: z.string(),
				password: z.string(),
				server: z.string(),
				port: z.number(),
				ssl: z.boolean().default(true),
			})
			.optional()
			.describe('IMAP configuration (required for some provider types)'),
		signature: z
			.string()
			.optional()
			.describe('Signature ID to use with this provider'),
	},
	async ({
		sender_name,
		sender_email,
		email_type,
		sender_password,
		smtp_config,
		imap_config,
		signature,
	}) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		// Check required fields based on email type
		if (email_type === 'SMTP' && !smtp_config) {
			return {
				content: [
					{
						type: 'text',
						text: 'SMTP configuration is required for SMTP email type',
					},
				],
			}
		}

		const payload = {
			senderName: sender_name,
			senderEmail: sender_email,
			emailType: email_type,
			...(sender_password && { senderPassword: sender_password }),
			...(smtp_config && { smtp: smtp_config }),
			...(imap_config && { imap: imap_config }),
			...(signature && { signature }),
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/email-providers`,
			{
				method: 'POST',
				body: JSON.stringify(payload),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{ type: 'text', text: 'Failed to add email provider' },
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Successfully added email provider: ${sender_name} <${sender_email}>`,
				},
			],
		}
	}
)

// Email provider warmup management
server.tool(
	'get-email-warmups',
	'List warmups for all email providers',
	{},
	async () => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/email-providers/warmup`
		)

		if (!response || !response.success) {
			return {
				content: [
					{ type: 'text', text: 'Failed to retrieve email warmups' },
				],
			}
		}

		const warmups = (response.warmups as Array<Record<string, any>>) || []
		if (warmups.length === 0) {
			return {
				content: [{ type: 'text', text: 'No email warmups found' }],
			}
		}

		const warmupsText = warmups
			.map((warmup) => {
				let text = `Email: ${warmup.email || '-'}\n`
				text += `Status: ${warmup.running ? 'Running' : 'Stopped'}\n`
				if (warmup.startDate) {
					text += `Start Date: ${new Date(warmup.startDate).toLocaleString()}\n`
				}
				text += `Emails Sent: ${warmup.emailsSent || 0}\n`
				text += `Emails Received: ${warmup.emailsReceived || 0}\n`
				text += `Spam Count: ${warmup.spamCount || 0}\n`
				text += `Score: ${warmup.score || 0}\n`

				if (warmup.disabledReason) {
					text += `Disabled Reason: ${warmup.disabledReason}\n`
				}
				text += `---`
				return text
			})
			.join('\n')

		return {
			content: [
				{ type: 'text', text: `Email Warmups:\n\n${warmupsText}` },
			],
		}
	}
)

server.tool(
	'enable-email-warmup',
	'Enable warmup for an email provider',
	{
		provider_id: z
			.string()
			.describe('ID of the email provider to enable warmup for'),
	},
	async ({ provider_id }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/email-providers/warmup/enable`,
			{
				method: 'POST',
				body: JSON.stringify({ providerId: provider_id }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{ type: 'text', text: 'Failed to enable email warmup' },
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Successfully enabled warmup for email provider with ID: ${provider_id}`,
				},
			],
		}
	}
)

server.tool(
	'disable-email-warmup',
	'Disable warmup for an email provider',
	{
		provider_id: z
			.string()
			.describe('ID of the email provider to disable warmup for'),
	},
	async ({ provider_id }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/email-providers/warmup/disable`,
			{
				method: 'POST',
				body: JSON.stringify({ providerId: provider_id }),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{ type: 'text', text: 'Failed to disable email warmup' },
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Successfully disabled warmup for email provider with ID: ${provider_id}`,
				},
			],
		}
	}
)

// Email campaign reply
server.tool(
	'reply-to-email',
	'Reply to an email from an Emelia campaign',
	{
		sender_email: z
			.string()
			.email()
			.optional()
			.describe(
				'Sender email address (Optional if providerId is provided)'
			),
		provider_id: z
			.string()
			.optional()
			.describe('Provider ID (Optional if senderEmail is provided)'),
		message_id: z
			.string()
			.optional()
			.describe('Original message ID (Optional)'),
		subject: z.string().describe('Reply subject'),
		content: z.string().describe('Reply content/body'),
		to: z
			.array(z.string().email())
			.optional()
			.describe('Recipients (Optional)'),
		cc: z
			.array(z.string().email())
			.optional()
			.describe('CC recipients (Optional)'),
		bcc: z
			.array(z.string().email())
			.optional()
			.describe('BCC recipients (Optional)'),
		attachments: z
			.array(
				z.object({
					name: z.string(),
					url: z.string(),
				})
			)
			.optional()
			.describe('Attachments as array of {name, url} objects (Optional)'),
	},
	async ({
		sender_email,
		provider_id,
		message_id,
		subject,
		content,
		to,
		cc,
		bcc,
		attachments,
	}) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		if (!sender_email && !provider_id) {
			return {
				content: [
					{
						type: 'text',
						text: 'Either sender_email or provider_id must be provided',
					},
				],
			}
		}

		const payload: Record<string, any> = {
			content,
			subject,
		}

		if (sender_email) payload.senderEmail = sender_email
		if (provider_id) payload.providerId = provider_id
		if (message_id) payload.messageId = message_id
		if (to) payload.to = to
		if (cc) payload.cc = cc
		if (bcc) payload.bcc = bcc
		if (attachments) payload.attachments = attachments

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/emails/reply`,
			{
				method: 'POST',
				body: JSON.stringify(payload),
			}
		)

		if (!response || !response.success) {
			return {
				content: [{ type: 'text', text: 'Failed to send reply' }],
			}
		}

		return {
			content: [{ type: 'text', text: `Successfully sent email reply` }],
		}
	}
)

// Update contact custom field
server.tool(
	'update-contact-field',
	'Update a custom field for an email contact',
	{
		campaign_id: z.string().describe('Campaign ID'),
		email: z.string().email().describe('Contact email address'),
		field_name: z.string().describe('Name of the custom field to update'),
		field_value: z.string().describe('New value for the custom field'),
	},
	async ({ campaign_id, email, field_name, field_value }) => {
		if (!getEmeliaApiKey()) {
			return {
				content: [
					{
						type: 'text',
						text: 'Authentication required. Please use the authenticate tool with your Emelia API key first.',
					},
				],
			}
		}

		const response = await makeEmeliaRequest<EmeliaApiResponse>(
			`${EMELIA_REST_API}/emails/contacts`,
			{
				method: 'PATCH',
				body: JSON.stringify({
					campaignId: campaign_id,
					email,
					fieldName: field_name,
					fieldValue: field_value,
				}),
			}
		)

		if (!response || !response.success) {
			return {
				content: [
					{
						type: 'text',
						text: 'Failed to update contact custom field',
					},
				],
			}
		}

		return {
			content: [
				{
					type: 'text',
					text: `Custom field "${field_name}" updated to "${field_value}" for contact with email ${email}`,
				},
			],
		}
	}
)

async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
	console.error('Emelia MCP Server running on stdio')
}

main().catch((error) => {
	console.error('Fatal error in main():', error)
	process.exit(1)
})
