import { CampaignModel, Document } from './types/models.js'

const USER_AGENT = 'emelia-mcp/1.0'
let userApiKey: string | null = null

export function setEmeliaApiKey(apiKey: string): void {
	userApiKey = apiKey
}

export function clearEmeliaApiKey(): void {
	userApiKey = null
}

export function getEmeliaApiKey(): string | null {
	return userApiKey || null
}

// Helper function for making Emelia API requests
export async function makeEmeliaRequest<T>(
	url: string,
	options?: RequestInit
): Promise<T | null> {
	const apiKey = getEmeliaApiKey()

	if (!apiKey) {
		console.error('No API key available. Please set your Emelia API key.')
		return null
	}

	const headers = {
		'User-Agent': USER_AGENT,
		Accept: 'application/json',
		Authorization: `Bearer ${apiKey}`,
		'Content-Type': 'application/json',
	}

	try {
		const requestOptions: RequestInit = {
			...options,
			headers: {
				...headers,
				...(options?.headers || {}),
			},
		}

		const response = await fetch(url, requestOptions)
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}
		return (await response.json()) as T
	} catch (error) {
		console.error('Error making Emelia API request:', error)
		return null
	}
}

// Format alert data
export function formatCampaign(campaign: CampaignModel & Document): string {
	return [
		`Campaign ID: ${campaign._id || '-'}`,
		`Campaign Name: ${campaign.name || '-'}`,
		`Campaign Status: ${campaign.status || '-'}`,
		`Campaign Type: Email`,
		'---',
	].join('\n')
}

export interface CampaignsResponse {
	error?: string
	success: boolean
	campaigns: (CampaignModel & Document)[]
}

// Generic response interface for Emelia API
export interface EmeliaApiResponse {
	success: boolean
	error?: string
	[key: string]: any
}
