import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest } from '../../shared/transport';
import { buildRequestOptions } from '../../shared/descriptions';

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const url = this.getNodeParameter('url', index) as string;
	const formats = this.getNodeParameter('formats', index, ['markdown']) as string[];
	const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = {
		url,
		formats,
		...buildRequestOptions(options),
	};

	if (additionalFields.onlyMainContent !== undefined) {
		body.onlyMainContent = additionalFields.onlyMainContent;
	}

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/smart-scrape',
		body,
	)) as IDataObject;

	return [{ json: response, pairedItem: { item: index } }];
}
