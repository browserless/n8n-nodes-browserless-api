import type { INodeProperties } from 'n8n-workflow';

export const screenshotFields: INodeProperties[] = [
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				operation: ['screenshot'],
			},
		},
		options: [
			{
				displayName: 'Capture Beyond Viewport',
				name: 'captureBeyondViewport',
				type: 'boolean',
				default: false,
				description: 'Whether to capture content beyond the viewport boundaries',
			},
			{
				displayName: 'Clip Height',
				name: 'clipHeight',
				type: 'number',
				default: 0,
				description: 'Height of the clipping region in pixels',
			},
			{
				displayName: 'Clip Width',
				name: 'clipWidth',
				type: 'number',
				default: 0,
				description: 'Width of the clipping region in pixels',
			},
			{
				displayName: 'Clip X',
				name: 'clipX',
				type: 'number',
				default: 0,
				description: 'X coordinate of the clipping region',
			},
			{
				displayName: 'Clip Y',
				name: 'clipY',
				type: 'number',
				default: 0,
				description: 'Y coordinate of the clipping region',
			},
			{
				displayName: 'Encoding',
				name: 'encoding',
				type: 'options',
				options: [
					{ name: 'Base64', value: 'base64' },
					{ name: 'Binary', value: 'binary' },
				],
				default: 'binary',
				description: 'The encoding of the screenshot output',
			},
			{
				displayName: 'Full Page',
				name: 'fullPage',
				type: 'boolean',
				default: false,
				description: 'Whether to capture the full scrollable page',
			},
			{
				displayName: 'Image Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'JPEG', value: 'jpeg' },
					{ name: 'PNG', value: 'png' },
					{ name: 'WebP', value: 'webp' },
				],
				default: 'png',
				description: 'The image format for the screenshot',
			},
			{
				displayName: 'Omit Background',
				name: 'omitBackground',
				type: 'boolean',
				default: false,
				description:
					'Whether to hide the default white background for transparent screenshots',
			},
			{
				displayName: 'Optimize For Speed',
				name: 'optimizeForSpeed',
				type: 'boolean',
				default: false,
				description: 'Whether to optimize screenshot capture speed over quality',
			},
			{
				displayName: 'Quality',
				name: 'quality',
				type: 'number',
				typeOptions: {
					minValue: 0,
					maxValue: 100,
				},
				default: 80,
				description: 'Image quality (0-100), only applies to JPEG and WebP formats',
			},
			{
				displayName: 'Selector',
				name: 'selector',
				type: 'string',
				default: '',
				placeholder: 'e.g. #main-content',
				description: 'CSS selector of a specific element to screenshot',
			},
		],
	},
];
