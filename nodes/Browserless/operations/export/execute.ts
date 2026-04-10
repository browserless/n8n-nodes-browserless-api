import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest, type BinaryResponse } from '../../shared/transport';

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const url = this.getNodeParameter('url', index) as string;
	const fileName = this.getNodeParameter('fileName', index, 'export') as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = { url };

	if (additionalFields.includeResources) body.includeResources = true;
	if (additionalFields.bestAttempt) body.bestAttempt = true;
	if (additionalFields.waitForTimeout) body.waitForTimeout = additionalFields.waitForTimeout;

	// Goto options
	const gotoOptions: Record<string, unknown> = {};
	if (additionalFields.waitUntil) gotoOptions.waitUntil = additionalFields.waitUntil;
	if (additionalFields.gotoTimeout) gotoOptions.timeout = additionalFields.gotoTimeout;
	if (additionalFields.referer) gotoOptions.referer = additionalFields.referer;
	if (Object.keys(gotoOptions).length > 0) body.gotoOptions = gotoOptions;

	// Wait options
	if (additionalFields.waitForSelector) {
		body.waitForSelector = { selector: additionalFields.waitForSelector };
	}
	if (additionalFields.waitForFunction) {
		body.waitForFunction = { fn: additionalFields.waitForFunction };
	}
	if (additionalFields.waitForEvent) {
		body.waitForEvent = { event: additionalFields.waitForEvent };
	}

	// Headers
	if (additionalFields.headers) {
		try {
			const parsed = JSON.parse(additionalFields.headers as string);
			if (Object.keys(parsed).length > 0) body.headers = parsed;
		} catch {
			// ignore invalid JSON
		}
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
