import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest } from '../../shared/transport';

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const query = this.getNodeParameter('query', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = { query };

	if (additionalFields.limit) body.limit = additionalFields.limit;
	if (additionalFields.lang) body.lang = additionalFields.lang;
	if (additionalFields.country) body.country = additionalFields.country;
	if (additionalFields.location) body.location = additionalFields.location;
	if (additionalFields.tbs) body.tbs = additionalFields.tbs;
	if (additionalFields.timeout) body.timeout = additionalFields.timeout;

	if (
		additionalFields.sources &&
		(additionalFields.sources as string[]).length > 0
	) {
		body.sources = additionalFields.sources;
	}

	if (
		additionalFields.categories &&
		(additionalFields.categories as string[]).length > 0
	) {
		body.categories = additionalFields.categories;
	}

	// Build scrapeOptions if any scrape fields are set
	const scrapeFormats = additionalFields.scrapeFormats as string[] | undefined;
	if (scrapeFormats && scrapeFormats.length > 0) {
		const scrapeOptions: Record<string, unknown> = {
			formats: scrapeFormats,
		};
		if (additionalFields.scrapeOnlyMainContent) scrapeOptions.onlyMainContent = true;
		if (additionalFields.scrapeStripNonContentTags) scrapeOptions.stripNonContentTags = true;
		if (additionalFields.scrapeRemoveBase64Images) scrapeOptions.removeBase64Images = true;
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
		body.scrapeOptions = scrapeOptions;
	}

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/search',
		body,
	)) as IDataObject;

	return [{ json: response, pairedItem: { item: index } }];
}
