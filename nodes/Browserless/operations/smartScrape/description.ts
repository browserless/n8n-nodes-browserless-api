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
				displayName: 'Exclude Tags',
				name: 'excludeTags',
				type: 'string',
				default: '',
				placeholder: 'e.g. nav, footer, .cookie-banner',
				description:
					'Comma-separated CSS selectors to remove from the page output, up to 100. Malformed selectors are ignored. Cannot be combined with Include Tags. Selectors that contain a comma must be passed as an expression returning a list.',
			},
			{
				displayName: 'Include Tags',
				name: 'includeTags',
				type: 'string',
				default: '',
				placeholder: 'e.g. article, main, .price',
				description:
					'Comma-separated CSS selectors to keep in the page output, up to 100. Malformed selectors are ignored; if no selector matches, unfiltered content is returned. Cannot be combined with Exclude Tags or with Only Main Content turned on. Selectors that contain a comma must be passed as an expression returning a list.',
			},
			{
				displayName: 'Only Main Content',
				name: 'onlyMainContent',
				type: 'boolean',
				default: false,
				description:
					'Whether to keep only the main content of the page, removing navigation, headers, footers and sidebars. If this field is not added, the API default (true) applies, except when Include Tags is set. Set to false to get the full page.',
			},
		],
	},
];
