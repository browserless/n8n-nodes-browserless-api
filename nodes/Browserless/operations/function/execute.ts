import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { browserlessApiRequest } from '../../shared/transport';

export function buildFunctionRequestBody(code: string, context: Record<string, unknown>): string {
	if (!/\bexport\s+default\b/.test(code)) {
		throw new Error('Browserless Function code must include an export default function');
	}

	const contextLiteral = JSON.stringify(context).replace(/</g, '\\u003c');
	const wrappedCode = code.replace(/\bexport\s+default\b/, 'const __browserlessFunction =');

	return `const __browserlessContext = ${contextLiteral};
${wrappedCode}
export default async function (args) {
	return await __browserlessFunction({
		...args,
		context: __browserlessContext,
	});
}
`;
}

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

	const body = buildFunctionRequestBody(code, context);

	const response = (await browserlessApiRequest.call(
		this,
		'POST',
		'/function',
		body,
		{ contentType: 'application/javascript' },
	)) as IDataObject;

	return [{ json: response, pairedItem: { item: index } }];
}
