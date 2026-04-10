import type { INodeProperties } from 'n8n-workflow';

export const exportFields: INodeProperties[] = [
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: 'export',
		description: 'The name for the exported file',
		displayOptions: {
			show: {
				operation: ['exportContent'],
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				operation: ['exportContent'],
			},
		},
		options: [
			{
				displayName: 'Best Attempt',
				name: 'bestAttempt',
				type: 'boolean',
				default: false,
				description: 'Whether to proceed even if timeouts or async operations fail',
			},
			{
				displayName: 'Goto Timeout',
				name: 'gotoTimeout',
				type: 'number',
				default: 0,
				description: 'Maximum time in milliseconds to wait for navigation',
			},
			{
				displayName: 'Headers',
				name: 'headers',
				type: 'json',
				default: '{}',
				placeholder: 'e.g. {"Authorization": "Bearer token"}',
				description: 'Custom HTTP headers to send with the request',
			},
			{
				displayName: 'Include Resources',
				name: 'includeResources',
				type: 'boolean',
				default: false,
				description:
					'Whether to bundle all page resources (CSS, images, etc.) into a ZIP file',
			},
			{
				displayName: 'Referer',
				name: 'referer',
				type: 'string',
				default: '',
				description: 'Referer URL to send with the navigation request',
			},
			{
				displayName: 'Wait For Event',
				name: 'waitForEvent',
				type: 'string',
				default: '',
				placeholder: 'e.g. networkidle',
				description: 'Wait for a specific page event before continuing',
			},
			{
				displayName: 'Wait For Function',
				name: 'waitForFunction',
				type: 'string',
				default: '',
				placeholder: 'e.g. () => document.querySelector("#loaded")',
				description: 'Wait for a JavaScript function to return truthy',
			},
			{
				displayName: 'Wait For Selector',
				name: 'waitForSelector',
				type: 'string',
				default: '',
				placeholder: 'e.g. h1',
				description: 'Wait for a CSS selector to appear on the page',
			},
			{
				displayName: 'Wait For Timeout',
				name: 'waitForTimeout',
				type: 'number',
				default: 0,
				description: 'Wait for a specified number of milliseconds before continuing',
			},
			{
				displayName: 'Wait Until',
				name: 'waitUntil',
				type: 'options',
				options: [
					{ name: 'DOM Content Loaded', value: 'domcontentloaded' },
					{ name: 'Load', value: 'load' },
					{ name: 'Network Idle (0 Connections)', value: 'networkidle0' },
					{ name: 'Network Idle (2 Connections)', value: 'networkidle2' },
				],
				default: 'load',
				description: 'When to consider navigation as finished',
			},
		],
	},
];
