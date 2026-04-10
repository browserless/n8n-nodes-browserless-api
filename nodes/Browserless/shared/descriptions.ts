import type { INodeProperties } from 'n8n-workflow';

/** Shared URL field used by most operations */
export function getUrlField(operations: string[]): INodeProperties {
	return {
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. https://example.com',
		description: 'The URL of the page to process',
		displayOptions: {
			show: {
				operation: operations,
			},
		},
	};
}

/** Shared wait/navigation options used by many operations */
export function getWaitOptions(operations: string[]): INodeProperties {
	return {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				operation: operations,
			},
		},
		options: [
			{
				displayName: 'Authentication Password',
				name: 'authPassword',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Password for HTTP basic authentication',
			},
			{
				displayName: 'Authentication Username',
				name: 'authUsername',
				type: 'string',
				default: '',
				description: 'Username for HTTP basic authentication',
			},
			{
				displayName: 'Best Attempt',
				name: 'bestAttempt',
				type: 'boolean',
				default: false,
				description: 'Whether to proceed even if timeouts or async operations fail',
			},
			{
				displayName: 'Block Ads',
				name: 'blockAds',
				type: 'boolean',
				default: false,
				description: 'Whether to block ads using uBlock Origin',
			},
			{
				displayName: 'Cookies',
				name: 'cookies',
				type: 'json',
				default: '[]',
				placeholder:
					'e.g. [{"name": "session", "value": "abc123", "domain": "example.com"}]',
				description: 'Cookies to set on the page before navigation',
			},
			{
				displayName: 'Emulate Media Type',
				name: 'emulateMediaType',
				type: 'options',
				options: [
					{ name: 'None', value: '' },
					{ name: 'Print', value: 'print' },
					{ name: 'Screen', value: 'screen' },
				],
				default: '',
				description: 'Emulate a specific CSS media type',
			},
			{
				displayName: 'Extra HTTP Headers',
				name: 'setExtraHTTPHeaders',
				type: 'json',
				default: '{}',
				placeholder: 'e.g. {"X-Custom-Header": "value"}',
				description: 'Additional HTTP headers to send with the request',
			},
			{
				displayName: 'Goto Timeout',
				name: 'gotoTimeout',
				type: 'number',
				default: 0,
				description: 'Maximum time in milliseconds to wait for navigation',
			},
			{
				displayName: 'HTML',
				name: 'html',
				type: 'string',
				typeOptions: { rows: 5 },
				default: '',
				description: 'Raw HTML to render instead of navigating to a URL',
			},
			{
				displayName: 'JavaScript Enabled',
				name: 'setJavaScriptEnabled',
				type: 'boolean',
				default: true,
				description: 'Whether JavaScript is enabled on the page',
			},
			{
				displayName: 'Referer',
				name: 'referer',
				type: 'string',
				default: '',
				description: 'Referer URL to send with the navigation request',
			},
			{
				displayName: 'Reject Request Pattern',
				name: 'rejectRequestPattern',
				type: 'string',
				default: '',
				placeholder: 'e.g. *.css,*.png,tracker.js',
				description:
					'Comma-separated URL patterns to block (supports wildcards)',
			},
			{
				displayName: 'Reject Resource Types',
				name: 'rejectResourceTypes',
				type: 'multiOptions',
				options: [
					{ name: 'Document', value: 'document' },
					{ name: 'Fetch', value: 'fetch' },
					{ name: 'Font', value: 'font' },
					{ name: 'Image', value: 'image' },
					{ name: 'Media', value: 'media' },
					{ name: 'Script', value: 'script' },
					{ name: 'Stylesheet', value: 'stylesheet' },
					{ name: 'XHR', value: 'xhr' },
				],
				default: [],
				description: 'Resource types to block from loading',
			},
			{
				displayName: 'Scroll Page',
				name: 'scrollPage',
				type: 'boolean',
				default: false,
				description: 'Whether to scroll the page to trigger lazy-loaded content',
			},
			{
				displayName: 'User Agent',
				name: 'userAgent',
				type: 'string',
				default: '',
				placeholder: 'e.g. Mozilla/5.0...',
				description: 'Custom user agent string to use',
			},
			{
				displayName: 'Viewport Height',
				name: 'viewportHeight',
				type: 'number',
				default: 0,
				description: 'Browser viewport height in pixels (0 uses default)',
			},
			{
				displayName: 'Viewport Width',
				name: 'viewportWidth',
				type: 'number',
				default: 0,
				description: 'Browser viewport width in pixels (0 uses default)',
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
				description: 'Wait for a CSS selector to appear on the page before continuing',
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
	};
}

/** Build the full request body from the shared options collection */
export function buildRequestOptions(options: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	// Goto options
	const gotoOptions: Record<string, unknown> = {};
	if (options.waitUntil) gotoOptions.waitUntil = options.waitUntil;
	if (options.gotoTimeout) gotoOptions.timeout = options.gotoTimeout;
	if (options.referer) gotoOptions.referer = options.referer;
	if (Object.keys(gotoOptions).length > 0) result.gotoOptions = gotoOptions;

	// Wait options
	if (options.waitForSelector) {
		result.waitForSelector = { selector: options.waitForSelector };
	}
	if (options.waitForTimeout) {
		result.waitForTimeout = options.waitForTimeout;
	}
	if (options.waitForFunction) {
		result.waitForFunction = { fn: options.waitForFunction };
	}
	if (options.waitForEvent) {
		result.waitForEvent = { event: options.waitForEvent };
	}

	// Simple boolean/string options
	if (options.bestAttempt) result.bestAttempt = true;
	if (options.blockAds) result.blockAds = true;
	if (options.scrollPage) result.scrollPage = true;
	if (options.emulateMediaType) result.emulateMediaType = options.emulateMediaType;
	if (options.setJavaScriptEnabled === false) result.setJavaScriptEnabled = false;
	if (options.html) result.html = options.html;

	// Authentication
	if (options.authUsername || options.authPassword) {
		result.authenticate = {
			username: options.authUsername || '',
			password: options.authPassword || '',
		};
	}

	// User agent
	if (options.userAgent) {
		result.userAgent = options.userAgent;
	}

	// Viewport
	if (options.viewportWidth || options.viewportHeight) {
		result.viewport = {
			...(options.viewportWidth ? { width: options.viewportWidth } : {}),
			...(options.viewportHeight ? { height: options.viewportHeight } : {}),
		};
	}

	// Cookies
	if (options.cookies) {
		try {
			const parsed = JSON.parse(options.cookies as string);
			if (Array.isArray(parsed) && parsed.length > 0) result.cookies = parsed;
		} catch {
			// ignore invalid JSON
		}
	}

	// Extra HTTP headers
	if (options.setExtraHTTPHeaders) {
		try {
			const parsed = JSON.parse(options.setExtraHTTPHeaders as string);
			if (Object.keys(parsed).length > 0) result.setExtraHTTPHeaders = parsed;
		} catch {
			// ignore invalid JSON
		}
	}

	// Reject patterns/resources
	if (options.rejectRequestPattern) {
		result.rejectRequestPattern = (options.rejectRequestPattern as string)
			.split(',')
			.map((s) => s.trim());
	}
	if (
		options.rejectResourceTypes &&
		Array.isArray(options.rejectResourceTypes) &&
		(options.rejectResourceTypes as string[]).length > 0
	) {
		result.rejectResourceTypes = options.rejectResourceTypes;
	}

	return result;
}
