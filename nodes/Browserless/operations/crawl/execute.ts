import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest } from '../../shared/transport';
import { buildRequestOptions } from '../../shared/descriptions';

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
	const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

	const body: Record<string, unknown> = {
		url,
		limit,
		...buildRequestOptions(options),
	};

	if (additionalFields.allowExternalLinks) body.allowExternalLinks = true;
	if (additionalFields.allowSubdomains) body.allowSubdomains = true;
	if (additionalFields.maxDepth !== undefined) body.maxDepth = additionalFields.maxDepth;
	if (additionalFields.delay !== undefined) body.delay = additionalFields.delay;

	if (additionalFields.includePaths) {
		body.includePaths = (additionalFields.includePaths as string).split(',').map((s) => s.trim());
	}
	if (additionalFields.excludePaths) {
		body.excludePaths = (additionalFields.excludePaths as string).split(',').map((s) => s.trim());
	}

	if (additionalFields.formats) {
		body.scrapeOptions = {
			formats: additionalFields.formats,
		};
	}

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/crawl',
		body,
	)) as IDataObject;

	return [{ json: response, pairedItem: { item: index } }];
}
