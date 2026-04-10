import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest, type BinaryResponse } from '../../shared/transport';
import { buildRequestOptions } from '../../shared/descriptions';

const MIME_TYPES: Record<string, string> = {
	png: 'image/png',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
};

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const url = this.getNodeParameter('url', index) as string;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as Record<
		string,
		unknown
	>;
	const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

	const screenshotOptions: Record<string, unknown> = {};
	const imageType = (additionalFields.type as string) || 'png';

	if (additionalFields.type) screenshotOptions.type = additionalFields.type;
	if (additionalFields.fullPage) screenshotOptions.fullPage = additionalFields.fullPage;
	if (additionalFields.quality !== undefined) screenshotOptions.quality = additionalFields.quality;
	if (additionalFields.omitBackground) screenshotOptions.omitBackground = true;
	if (additionalFields.encoding) screenshotOptions.encoding = additionalFields.encoding;
	if (additionalFields.optimizeForSpeed) screenshotOptions.optimizeForSpeed = true;
	if (additionalFields.captureBeyondViewport) screenshotOptions.captureBeyondViewport = true;

	// Clip region
	if (additionalFields.clipWidth || additionalFields.clipHeight) {
		screenshotOptions.clip = {
			x: additionalFields.clipX || 0,
			y: additionalFields.clipY || 0,
			width: additionalFields.clipWidth || 0,
			height: additionalFields.clipHeight || 0,
		};
	}

	const body: Record<string, unknown> = {
		url,
		options: screenshotOptions,
		...buildRequestOptions(options),
	};

	if (additionalFields.selector) {
		body.selector = additionalFields.selector;
	}

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/chromium/screenshot',
		body,
		{ encoding: 'arraybuffer' },
	)) as BinaryResponse;

	const mimeType = MIME_TYPES[imageType] || 'image/png';
	const fileName = `screenshot.${imageType}`;

	const binaryData = await this.helpers.prepareBinaryData(
		Buffer.from(response.body),
		fileName,
		mimeType,
	);

	return [
		{
			json: { success: true },
			binary: { data: binaryData },
			pairedItem: { item: index },
		},
	];
}
