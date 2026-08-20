import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

interface BinaryResponse {
	body: Buffer;
	headers: Record<string, string>;
}

interface RequestOptions {
	encoding?: 'arraybuffer';
	contentType?: string;
}

export function buildHttpRequestOptions(
	method: 'GET' | 'POST' | 'DELETE',
	url: string,
	body: object | string = {},
	options: RequestOptions = {},
): IHttpRequestOptions {
	return {
		method,
		url,
		...(method === 'GET' ? {} : { body }),
		json: options.contentType ? false : !options.encoding,
	};
}

export async function browserlessApiRequest(
	this: IExecuteFunctions,
	method: 'GET' | 'POST' | 'DELETE',
	endpoint: string,
	body: object | string = {},
	options: RequestOptions = {},
) {
	const credentials = await this.getCredentials('browserlessApi');
	const baseUrl = (credentials.url as string).replace(/\/+$/, '');

	const requestOptions = buildHttpRequestOptions(method, `${baseUrl}${endpoint}`, body, options);

	if (options.contentType) {
		requestOptions.headers = {
			...(requestOptions.headers ?? {}),
			'Content-Type': options.contentType,
		};
	}

	if (options.encoding) {
		requestOptions.encoding = options.encoding;
		requestOptions.returnFullResponse = true;
		requestOptions.json = false;
	}

	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'browserlessApi',
		requestOptions,
	)) as typeof options.encoding extends 'arraybuffer' ? BinaryResponse : object;
}

export type { BinaryResponse };
