import type { INodeProperties } from 'n8n-workflow';

const displayOptions = { show: { operation: ['agentRun'] } };

export const agentRunFields: INodeProperties[] = [
	{
		displayName: 'Task',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 3 },
		placeholder: 'e.g. Go to example.com and tell me the main heading',
		description: 'The task for the agent, in plain language. Minimum 10 characters.',
		displayOptions,
	},
	{
		displayName: 'Wait for Result',
		name: 'waitForResult',
		type: 'boolean',
		default: true,
		description:
			'Whether to wait for the run to finish and return its result, instead of returning the run ID immediately',
		displayOptions,
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions,
		options: [
			{
				displayName: 'Allowed Domains',
				name: 'allowedDomains',
				type: 'string',
				default: '',
				placeholder: 'e.g. example.com,docs.example.com',
				description: 'Comma-separated list of domains the agent may navigate to',
			},
			{
				displayName: 'Max Steps',
				name: 'maxSteps',
				type: 'number',
				default: 30,
				description: 'Maximum number of browser actions the agent may take, up to 60',
			},
			{
				displayName: 'Profile',
				name: 'profile',
				type: 'string',
				default: '',
				description: 'Name of a saved authentication profile to reuse',
			},
			{
				displayName: 'Proxy',
				name: 'proxy',
				type: 'options',
				options: [
					{ name: 'Datacenter', value: 'datacenter' },
					{ name: 'None', value: '' },
					{ name: 'Residential', value: 'residential' },
				],
				default: '',
				description: 'Route the agent through a proxy',
			},
			{
				displayName: 'Proxy Country',
				name: 'proxyCountry',
				type: 'string',
				default: '',
				placeholder: 'e.g. US',
				description: 'Two-letter country code for the proxy exit',
			},
			{
				displayName: 'Response Schema',
				name: 'responseSchema',
				type: 'json',
				default: '{}',
				description: 'JSON Schema describing the shape the answer should take, applied best-effort',
			},
			{
				displayName: 'Solve Captchas',
				name: 'solveCaptchas',
				type: 'boolean',
				default: false,
				description: 'Whether to ask the agent to solve CAPTCHAs it encounters',
			},
			{
				displayName: 'Start URL',
				name: 'startUrl',
				type: 'string',
				default: '',
				placeholder: 'e.g. https://example.com',
				description: 'The page the agent opens first',
			},
			{
				displayName: 'Stealth',
				name: 'stealth',
				type: 'boolean',
				default: false,
				description: 'Whether to ask the agent to use anti-bot-detection mode',
			},
			{
				displayName: 'Timeout',
				name: 'timeout',
				type: 'number',
				default: 900000,
				description:
					'Time limit for the run in milliseconds, between 10000 and 900000. The node waits this long plus a 30-second grace period.',
			},
			{
				displayName: 'Webhook Events',
				name: 'webhookEvents',
				type: 'multiOptions',
				options: [
					{ name: 'Failed', value: 'failed' },
					{ name: 'Succeeded', value: 'succeeded' },
				],
				default: [],
				description: 'Events to send to the webhook URL',
			},
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				default: '',
				placeholder: 'e.g. https://your-server.com/webhook',
				description: 'HTTPS URL to receive a notification when the run finishes',
			},
		],
	},
];
