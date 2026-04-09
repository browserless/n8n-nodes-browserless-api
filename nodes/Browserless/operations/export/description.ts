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
		displayName: 'Include Resources',
		name: 'includeResources',
		type: 'boolean',
		default: false,
		description: 'Whether to bundle all page resources (CSS, images, etc.) into a ZIP file',
		displayOptions: {
			show: {
				operation: ['exportContent'],
			},
		},
	},
];
