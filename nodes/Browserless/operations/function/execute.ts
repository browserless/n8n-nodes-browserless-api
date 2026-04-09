import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest } from '../../shared/transport';

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const code = this.getNodeParameter('code', index) as string;
	const contextStr = this.getNodeParameter('context', index, '{}') as string;

	let context: Record<string, unknown> = {};
	try {
		context = JSON.parse(contextStr);
	} catch {
		context = {};
	}

	const body: Record<string, unknown> = {
		code,
		context,
	};

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/function',
		body,
	)) as IDataObject;

	return [{ json: response, pairedItem: { item: index } }];
}
