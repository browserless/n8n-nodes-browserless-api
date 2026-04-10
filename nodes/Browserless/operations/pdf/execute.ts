import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest, type BinaryResponse } from '../../shared/transport';
import { buildRequestOptions } from '../../shared/descriptions';

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

	const pdfOptions: Record<string, unknown> = {};

	if (additionalFields.format) pdfOptions.format = additionalFields.format;
	if (additionalFields.landscape) pdfOptions.landscape = true;
	if (additionalFields.printBackground) pdfOptions.printBackground = true;
	if (additionalFields.displayHeaderFooter) pdfOptions.displayHeaderFooter = true;
	if (additionalFields.headerTemplate) pdfOptions.headerTemplate = additionalFields.headerTemplate;
	if (additionalFields.footerTemplate) pdfOptions.footerTemplate = additionalFields.footerTemplate;
	if (additionalFields.scale !== undefined) pdfOptions.scale = additionalFields.scale;
	if (additionalFields.width) pdfOptions.width = additionalFields.width;
	if (additionalFields.height) pdfOptions.height = additionalFields.height;
	if (additionalFields.pageRanges) pdfOptions.pageRanges = additionalFields.pageRanges;
	if (additionalFields.preferCSSPageSize) pdfOptions.preferCSSPageSize = true;
	if (additionalFields.omitBackground) pdfOptions.omitBackground = true;
	if (additionalFields.tagged) pdfOptions.tagged = true;
	if (additionalFields.outline) pdfOptions.outline = true;
	if (additionalFields.timeout) pdfOptions.timeout = additionalFields.timeout;
	if (additionalFields.waitForFonts) pdfOptions.waitForFonts = true;
	if (additionalFields.fullPage) pdfOptions.fullPage = true;

	// Margins
	const margin: Record<string, string> = {};
	if (additionalFields.marginTop) margin.top = additionalFields.marginTop as string;
	if (additionalFields.marginBottom) margin.bottom = additionalFields.marginBottom as string;
	if (additionalFields.marginLeft) margin.left = additionalFields.marginLeft as string;
	if (additionalFields.marginRight) margin.right = additionalFields.marginRight as string;
	if (Object.keys(margin).length > 0) pdfOptions.margin = margin;

	const body: Record<string, unknown> = {
		url,
		options: pdfOptions,
		...buildRequestOptions(options),
	};

	// Block consent modals
	if (additionalFields.blockConsentModals) body.blockConsentModals = true;

	// Script/style injection
	if (additionalFields.addScriptTag) {
		try {
			const parsed = JSON.parse(additionalFields.addScriptTag as string);
			if (Array.isArray(parsed) && parsed.length > 0) body.addScriptTag = parsed;
		} catch {
			// ignore invalid JSON
		}
	}
	if (additionalFields.addStyleTag) {
		try {
			const parsed = JSON.parse(additionalFields.addStyleTag as string);
			if (Array.isArray(parsed) && parsed.length > 0) body.addStyleTag = parsed;
		} catch {
			// ignore invalid JSON
		}
	}

	const response = (await browserlessApiRequest.call(this, 'POST', '/chromium/pdf', body, {
		encoding: 'arraybuffer',
	})) as BinaryResponse;

	const binaryData = await this.helpers.prepareBinaryData(
		Buffer.from(response.body),
		'page.pdf',
		'application/pdf',
	);

	return [
		{
			json: { success: true },
			binary: { data: binaryData },
			pairedItem: { item: index },
		},
	];
}
