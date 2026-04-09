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

	const body: Record<string, unknown> = {
		query,
		...additionalFields,
	};

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/search',
		body,
	)) as IDataObject;

	return [{ json: response, pairedItem: { item: index } }];
}
