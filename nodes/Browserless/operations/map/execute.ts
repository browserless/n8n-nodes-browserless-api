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

	if (additionalFields.search) body.search = additionalFields.search;
	if (additionalFields.sitemap) body.sitemap = additionalFields.sitemap;
	if (additionalFields.includeSubdomains !== undefined)
		body.includeSubdomains = additionalFields.includeSubdomains;
	if (additionalFields.ignoreQueryParameters !== undefined)
		body.ignoreQueryParameters = additionalFields.ignoreQueryParameters;
	if (additionalFields.timeout) body.timeout = additionalFields.timeout;

	// Location
	if (additionalFields.locationCountry || additionalFields.locationLanguages) {
		const location: Record<string, unknown> = {};
		if (additionalFields.locationCountry) location.country = additionalFields.locationCountry;
		if (additionalFields.locationLanguages) {
			location.languages = (additionalFields.locationLanguages as string)
				.split(',')
				.map((s) => s.trim());
		}
		body.location = location;
	}

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/map',
		body,
	)) as IDataObject;

	return [{ json: response, pairedItem: { item: index } }];
}
