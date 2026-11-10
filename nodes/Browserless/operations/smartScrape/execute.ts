import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { browserlessApiRequest } from '../../shared/transport';
import { buildRequestOptions } from '../../shared/descriptions';

const MAX_SELECTORS = 100;

function toSelectorList(value: unknown): string[] | undefined {
	if (value === undefined) return [];
	const entries = typeof value === 'string' ? value.split(',') : value;
	if (!Array.isArray(entries) || !entries.every((entry) => typeof entry === 'string')) {
		return undefined;
	}
	return entries.map((entry) => entry.trim()).filter(Boolean);
}

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
	const selectors: Record<'includeTags' | 'excludeTags', string[]> = {
		includeTags: [],
		excludeTags: [],
	};
	for (const [key, label] of [
		['includeTags', 'Include Tags'],
		['excludeTags', 'Exclude Tags'],
	] as const) {
		const list = toSelectorList(additionalFields[key]);
		if (list === undefined) {
			throw new NodeOperationError(
				this.getNode(),
				`${label} must be a comma-separated list of CSS selectors`,
				{ itemIndex: index },
			);
		}
		if (list.length > MAX_SELECTORS) {
			throw new NodeOperationError(
				this.getNode(),
				`${label} accepts at most ${MAX_SELECTORS} selectors`,
				{ itemIndex: index },
			);
		}
		selectors[key] = list;
	}
	if (selectors.includeTags.length && selectors.excludeTags.length) {
		throw new NodeOperationError(
			this.getNode(),
			'Include Tags and Exclude Tags cannot be combined',
			{
				itemIndex: index,
			},
		);
	}
	if (selectors.includeTags.length && additionalFields.onlyMainContent === true) {
		throw new NodeOperationError(
			this.getNode(),
			'Include Tags cannot be combined with Only Main Content turned on',
			{ itemIndex: index },
		);
	}

	const body: Record<string, unknown> = {
		url,
		formats,
		...buildRequestOptions(options),
	};

	if (additionalFields.onlyMainContent !== undefined) {
		body.onlyMainContent = additionalFields.onlyMainContent;
	}
	if (selectors.includeTags.length) body.includeTags = selectors.includeTags;
	if (selectors.excludeTags.length) body.excludeTags = selectors.excludeTags;

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/smart-scrape',
		body,
	)) as IDataObject;

	return [{ json: response, pairedItem: { item: index } }];
}
