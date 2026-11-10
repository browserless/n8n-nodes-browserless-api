import type { INodeProperties } from 'n8n-workflow';

export const smartScrapeFields: INodeProperties[] = [
	{
		displayName: 'Formats',
		name: 'formats',
		type: 'multiOptions',
		options: [
			{ name: 'HTML', value: 'html' },
			{ name: 'Links', value: 'links' },
			{ name: 'Markdown', value: 'markdown' },
			{ name: 'PDF', value: 'pdf' },
			{ name: 'Screenshot', value: 'screenshot' },
		],
		default: ['markdown'],
		description: 'The output formats to return',
		displayOptions: {
			show: {
				operation: ['smartScrape'],
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
				operation: ['smartScrape'],
			},
		},
		options: [
			{
				displayName: 'Only Main Content',
				name: 'onlyMainContent',
				type: 'boolean',
				default: false,
				description:
					'Whether to keep only the main content of the page, removing navigation, headers, footers and sidebars. If this field is not added, the API default (true) applies. Set to false to get the full page.',
			},
		],
	},
];
