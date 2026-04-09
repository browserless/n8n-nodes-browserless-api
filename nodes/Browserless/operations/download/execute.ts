import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest, type BinaryResponse } from '../../shared/transport';

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const code = this.getNodeParameter('code', index, '') as string;
	const contextStr = this.getNodeParameter('context', index, '{}') as string;

	const body: Record<string, unknown> = {
		code,
	};

	try {
		body.context = JSON.parse(contextStr);
	} catch {
		body.context = {};
	}

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/download',
		body,
		{ encoding: 'arraybuffer' },
	)) as BinaryResponse;

	const contentType = response.headers?.['content-type'] || 'application/octet-stream';
	const contentDisposition = response.headers?.['content-disposition'] || '';
	let fileName = 'download';
	if (contentDisposition) {
		const match = contentDisposition.match(/filename="?([^";\s]+)"?/);
		if (match) fileName = match[1];
	}

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
