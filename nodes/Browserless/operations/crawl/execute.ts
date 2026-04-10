import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest } from '../../shared/transport';

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const url = this.getNodeParameter('url', index) as string;
	const limit = this.getNodeParameter('limit', index, 50) as number;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = {
		url,
		limit,
	};

	if (additionalFields.allowExternalLinks) body.allowExternalLinks = true;
	if (additionalFields.allowSubdomains) body.allowSubdomains = true;
	if (additionalFields.maxDepth !== undefined) body.maxDepth = additionalFields.maxDepth;
	if (additionalFields.maxRetries !== undefined) body.maxRetries = additionalFields.maxRetries;
	if (additionalFields.delay !== undefined) body.delay = additionalFields.delay;
	if (additionalFields.sitemap) body.sitemap = additionalFields.sitemap;

	if (additionalFields.includePaths) {
		body.includePaths = (additionalFields.includePaths as string).split(',').map((s) => s.trim());
	}
	if (additionalFields.excludePaths) {
		body.excludePaths = (additionalFields.excludePaths as string).split(',').map((s) => s.trim());
	}

	// Build scrapeOptions
	const scrapeOptions: Record<string, unknown> = {};
	if (additionalFields.formats) scrapeOptions.formats = additionalFields.formats;
	if (additionalFields.scrapeOnlyMainContent) scrapeOptions.onlyMainContent = true;
	if (additionalFields.scrapeWaitFor) scrapeOptions.waitFor = additionalFields.scrapeWaitFor;
	if (additionalFields.scrapeTimeout) scrapeOptions.timeout = additionalFields.scrapeTimeout;

	if (additionalFields.scrapeIncludeTags) {
		scrapeOptions.includeTags = (additionalFields.scrapeIncludeTags as string)
			.split(',')
			.map((s) => s.trim());
	}
	if (additionalFields.scrapeExcludeTags) {
		scrapeOptions.excludeTags = (additionalFields.scrapeExcludeTags as string)
			.split(',')
			.map((s) => s.trim());
	}
	if (additionalFields.scrapeHeaders) {
		try {
			const parsed = JSON.parse(additionalFields.scrapeHeaders as string);
			if (Object.keys(parsed).length > 0) scrapeOptions.headers = parsed;
		} catch {
			// ignore invalid JSON
		}
	}

	if (Object.keys(scrapeOptions).length > 0) body.scrapeOptions = scrapeOptions;

	// Webhook
	if (additionalFields.webhookUrl) {
		const webhook: Record<string, unknown> = {
			url: additionalFields.webhookUrl,
		};
		if (
			additionalFields.webhookEvents &&
			(additionalFields.webhookEvents as string[]).length > 0
		) {
			webhook.events = additionalFields.webhookEvents;
		}
		body.webhook = webhook;
	}

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/crawl',
		body,
	)) as IDataObject;

	return [{ json: response, pairedItem: { item: index } }];
}
