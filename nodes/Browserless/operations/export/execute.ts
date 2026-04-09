import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest, type BinaryResponse } from '../../shared/transport';

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const url = this.getNodeParameter('url', index) as string;
	const fileName = this.getNodeParameter('fileName', index, 'export') as string;

	const includeResources = this.getNodeParameter('includeResources', index, false) as boolean;

	const body: Record<string, unknown> = { url };

	if (includeResources) {
		body.includeResources = true;
	}

	const response = (await browserlessApiRequest.call(this, 'POST', '/chromium/export', body, {
		encoding: 'arraybuffer',
	})) as BinaryResponse;

	const contentType = response.headers?.['content-type'] || 'application/octet-stream';

	const binaryData = await this.helpers.prepareBinaryData(
		Buffer.from(response.body),
		fileName,
		contentType,
	);

	return [
		{
			json: { success: true },
			binary: { data: binaryData },
			pairedItem: { item: index },
		},
	];
}
