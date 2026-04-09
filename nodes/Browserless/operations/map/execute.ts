import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest } from '../../shared/transport';

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const url = this.getNodeParameter('url', index) as string;
	const limit = this.getNodeParameter('limit', index, 100) as number;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = {
		url,
		limit,
		...additionalFields,
	};

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/map',
		body,
	)) as IDataObject;

	return [{ json: response, pairedItem: { item: index } }];
}
