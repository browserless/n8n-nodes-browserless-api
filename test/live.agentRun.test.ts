/* eslint-disable @n8n/community-nodes/no-restricted-globals, @n8n/community-nodes/no-restricted-imports */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';
import type { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

const require = createRequire(import.meta.url);
const typescript = require('typescript') as typeof import('typescript');
require.extensions['.ts'] = (module, filename) => {
	const source = readFileSync(filename, 'utf8');
	const compiled = typescript.transpileModule(source, {
		compilerOptions: {
			module: typescript.ModuleKind.CommonJS,
			target: typescript.ScriptTarget.ES2022,
			esModuleInterop: true,
		},
		fileName: filename,
	}).outputText;
	(module as unknown as { _compile: (code: string, fileName: string) => void })._compile(
		compiled,
		filename,
	);
};
const { execute: executeAgentRun } =
	require('../nodes/Browserless/operations/agentRun/execute.ts') as typeof import('../nodes/Browserless/operations/agentRun/execute.ts');
const { execute: executeScreenshot } =
	require('../nodes/Browserless/operations/screenshot/execute.ts') as typeof import('../nodes/Browserless/operations/screenshot/execute.ts');
const { execute: executeSmartScrape } =
	require('../nodes/Browserless/operations/smartScrape/execute.ts') as typeof import('../nodes/Browserless/operations/smartScrape/execute.ts');

const baseUrlValue = process.env.BROWSERLESS_BASE_URL;
const tokenValue = process.env.BROWSERLESS_TOKEN;
if (!baseUrlValue || !tokenValue) {
	throw new Error('BROWSERLESS_BASE_URL and BROWSERLESS_TOKEN are required for live tests');
}

const baseUrl = new URL(baseUrlValue);
if (baseUrl.protocol !== 'https:') throw new Error('BROWSERLESS_BASE_URL must use HTTPS');
const token = tokenValue;
const runIds = new Set<string>();
let credentialProbePassed = false;

interface RecordedRequest {
	method: string;
	origin: string;
	pathname: string;
}

function parameterContext(
	parameters: Record<string, unknown>,
	credentialToken = token,
): { context: IExecuteFunctions; requests: RecordedRequest[] } {
	const requests: RecordedRequest[] = [];
	const context = {
		getNodeParameter: (name: string, _index: number, defaultValue?: unknown) =>
			parameters[name] ?? defaultValue,
		getCredentials: async () => ({ url: baseUrl.origin, token: credentialToken }),
		getNode: () => ({ name: 'Browserless' }),
		continueOnFail: () => false,
		helpers: {
			httpRequestWithAuthentication: async (_credential: string, options: IHttpRequestOptions) => {
				const requestUrl = new URL(options.url);
				requestUrl.searchParams.set('token', credentialToken);
				requests.push({
					method: options.method,
					origin: requestUrl.origin,
					pathname: requestUrl.pathname,
				});

				const headers = new Headers(options.headers as HeadersInit | undefined);
				let body: BodyInit | undefined;
				if (Object.hasOwn(options, 'body')) {
					if (typeof options.body === 'string') {
						body = options.body;
					} else {
						body = JSON.stringify(options.body);
						if (!headers.has('content-type')) headers.set('content-type', 'application/json');
					}
				}

				const response = await fetch(requestUrl, {
					method: options.method,
					headers,
					body,
				});
				if (!response.ok) {
					const error = new Error(`HTTP ${response.status} ${response.statusText}`) as Error & {
						statusCode: number;
					};
					error.statusCode = response.status;
					throw error;
				}

				if (options.encoding === 'arraybuffer') {
					return {
						body: Buffer.from(await response.arrayBuffer()),
						headers: Object.fromEntries(response.headers.entries()),
					};
				}
				return (await response.json()) as object;
			},
			prepareBinaryData: async (data: Buffer, fileName: string, mimeType: string) => ({
				data: data.toString('base64'),
				fileName,
				mimeType,
			}),
		},
	} as unknown as IExecuteFunctions;
	return { context, requests };
}

function assertOnlyCredentialHost(requests: RecordedRequest[]): void {
	assert.ok(requests.length > 0, 'expected at least one outbound request');
	for (const request of requests) assert.equal(request.origin, baseUrl.origin);
}

function rememberRun(result: unknown): void {
	const id = (result as { id?: unknown }).id;
	if (typeof id === 'string' && id.startsWith('run_')) runIds.add(id);
}

async function deleteRun(id: string): Promise<void> {
	const url = new URL(`/agent/run/${encodeURIComponent(id)}`, baseUrl);
	url.searchParams.set('token', token);
	const response = await fetch(url, { method: 'DELETE' });
	if (response.ok || response.status === 404) runIds.delete(id);
}

before(async () => {
	const { context, requests } = parameterContext({
		query: 'Open example.com and report the main heading',
		waitForResult: false,
		additionalFields: {},
	});
	const [item] = await executeAgentRun.call(context, 0);
	const result = item.json as { id?: unknown; status?: unknown };
	rememberRun(result);
	assertOnlyCredentialHost(requests);
	assert.match(String(result.id), /^run_/);
	assert.equal(result.status, 'pending');
	credentialProbePassed = true;
	await deleteRun(String(result.id));
});

after(async () => {
	await Promise.allSettled([...runIds].map(deleteRun));
});

test('L1 credentials create a real pending Agent run', () => {
	assert.equal(credentialProbePassed, true);
});

test('L2 wait-on returns a succeeded Example Domain answer', { timeout: 180000 }, async (t) => {
	const { context, requests } = parameterContext({
		query: "Go to https://example.com and tell me the exact text of the page's main heading",
		waitForResult: true,
		additionalFields: { maxSteps: 5, timeout: 120000, startUrl: 'https://example.com' },
	});
	const [item] = await executeAgentRun.call(context, 0);
	rememberRun(item.json);
	assertOnlyCredentialHost(requests);
	assert.equal(item.json.status, 'succeeded');
	assert.ok(Array.isArray(item.json.steps) && item.json.steps.length > 0);
	assert.match(JSON.stringify(item.json.data), /Example Domain/i);
	assert.deepEqual(item.pairedItem, { item: 0 });
	assert.equal(
		JSON.stringify(item).includes(token),
		false,
		'returned item must not contain credential',
	);
	t.diagnostic(
		`L2 evidence: status=succeeded step_count=${item.json.steps.length} answer_excerpt="Example Domain"`,
	);
});

test('L3 wait-off returns only id and status promptly', { timeout: 10000 }, async () => {
	const { context, requests } = parameterContext({
		query: "Go to https://example.com and tell me the exact text of the page's main heading",
		waitForResult: false,
		additionalFields: {},
	});
	const startedAt = Date.now();
	const [item] = await executeAgentRun.call(context, 0);
	const elapsedMs = Date.now() - startedAt;
	rememberRun(item.json);
	assertOnlyCredentialHost(requests);
	assert.deepEqual(Object.keys(item.json).sort(), ['id', 'status']);
	assert.match(String(item.json.id), /^run_/);
	assert.equal(item.json.status, 'pending');
	assert.ok(elapsedMs < 5000, 'wait-off request should return in under five seconds');
	assert.deepEqual(item.pairedItem, { item: 0 });
	await deleteRun(String(item.json.id));
});

test('L4 a short run budget returns a usable bounded result', { timeout: 60000 }, async () => {
	const { context, requests } = parameterContext({
		query:
			'Visit https://example.com, then https://example.org, then https://example.net and summarise all three',
		waitForResult: true,
		additionalFields: { maxSteps: 60, timeout: 10000, startUrl: 'https://example.com' },
	});
	const startedAt = Date.now();
	const [item] = await executeAgentRun.call(context, 0);
	const elapsedMs = Date.now() - startedAt;
	rememberRun(item.json);
	assertOnlyCredentialHost(requests);
	assert.match(String(item.json.id), /^run_/);
	assert.ok(elapsedMs < 60000, 'short-budget run should return within sixty seconds');
	const terminal = ['succeeded', 'failed', 'timed_out', 'stopped', 'capped'].includes(
		String(item.json.status),
	);
	assert.ok(terminal || item.json.waitTimedOut === true);
	assert.equal(
		JSON.stringify(item).includes(token),
		false,
		'returned item must not contain credential',
	);
});

test('L5 a too-short task surfaces HTTP 400', async () => {
	const { context } = parameterContext({ query: 'hi', waitForResult: false, additionalFields: {} });
	await assert.rejects(
		() => executeAgentRun.call(context, 0),
		(error: Error & { statusCode?: number }) => {
			assert.equal(error.statusCode, 400);
			assert.match(error.message, /HTTP 400/);
			return true;
		},
	);
});

test('L6 an invalid token surfaces HTTP 401 without leaking it', async () => {
	const invalidToken = 'definitely-invalid-token';
	const { context } = parameterContext(
		{
			query: 'Open example.com and report the main heading',
			waitForResult: false,
			additionalFields: {},
		},
		invalidToken,
	);
	let caught: unknown;
	try {
		await executeAgentRun.call(context, 0);
	} catch (error) {
		caught = error;
	}
	assert.equal((caught as { statusCode?: number }).statusCode, 401);
	assert.equal(
		JSON.stringify(caught).includes(invalidToken),
		false,
		'error must not contain credential',
	);
});

test(
	'L7 existing screenshot and smart-scrape POST paths still work',
	{ timeout: 60000 },
	async () => {
		const screenshot = parameterContext({
			url: 'https://example.com',
			additionalFields: {},
			options: {},
		});
		const [screenshotItem] = await executeScreenshot.call(screenshot.context, 0);
		assertOnlyCredentialHost(screenshot.requests);
		assert.ok(screenshotItem.binary?.data?.data.length > 0);

		const scrape = parameterContext({
			url: 'https://example.com',
			formats: ['markdown'],
			options: {},
		});
		const [scrapeItem] = await executeSmartScrape.call(scrape.context, 0);
		assertOnlyCredentialHost(scrape.requests);
		assert.match(JSON.stringify(scrapeItem.json), /Example Domain/i);
	},
);
