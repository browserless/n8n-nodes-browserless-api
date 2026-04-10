import type { INodeProperties } from 'n8n-workflow';

export const mapFields: INodeProperties[] = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				operation: ['mapUrls'],
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
				operation: ['mapUrls'],
			},
		},
		options: [
			{
				displayName: 'Ignore Query Parameters',
				name: 'ignoreQueryParameters',
				type: 'boolean',
				default: true,
				description: 'Whether to ignore query parameters when deduplicating URLs',
			},
			{
				displayName: 'Include Subdomains',
				name: 'includeSubdomains',
				type: 'boolean',
				default: true,
				description: 'Whether to include URLs from subdomains',
			},
			{
				displayName: 'Location Country',
				name: 'locationCountry',
				type: 'string',
				default: '',
				placeholder: 'e.g. us, gb, de',
				description: 'Country code for geo-targeted URL discovery',
			},
			{
				displayName: 'Location Languages',
				name: 'locationLanguages',
				type: 'string',
				default: '',
				placeholder: 'e.g. en,es,fr',
				description: 'Comma-separated language codes for geo-targeted URL discovery',
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Search term to rank results by relevance',
			},
			{
				displayName: 'Sitemap',
				name: 'sitemap',
				type: 'options',
				options: [
					{ name: 'Include', value: 'include' },
					{ name: 'Only', value: 'only' },
					{ name: 'Skip', value: 'skip' },
				],
				default: 'include',
				description: 'Whether to use the sitemap for URL discovery',
			},
			{
				displayName: 'Timeout',
				name: 'timeout',
				type: 'number',
				default: 0,
				description: 'Request timeout in milliseconds',
			},
		],
	},
];
