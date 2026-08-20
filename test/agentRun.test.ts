/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import type { IExecuteFunctions, IHttpRequestOptions, INodeProperties } from 'n8n-workflow';

import { BrowserlessApi } from '../credentials/BrowserlessApi.credentials.ts';
import { agentRunFields } from '../nodes/Browserless/operations/agentRun/description.ts';
import {
	buildAgentRunBody,
	DEFAULT_TIMEOUT_MS,
	POLL_INTERVAL_MS,
	pollUntilTerminal,
	TERMINAL_RUN_STATUSES,
	waitDeadline,
	WAIT_GRACE_MS,
	type AgentRunView,
} from '../nodes/Browserless/operations/agentRun/helpers.ts';
import { buildHttpRequestOptions } from '../nodes/Browserless/shared/transport.ts';

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
const { Browserless } =
	require('../nodes/Browserless/Browserless.node.ts') as typeof import('../nodes/Browserless/Browserless.node.ts');

const query = 'Open example.com and report its heading';

function view(status: string, overrides: Partial<AgentRunView> = {}): AgentRunView {
	return {
		id: 'run_test',
		status,
		data: null,
		error: null,
		steps: [],
		turns: [],
		created_at: '2026-08-20T00:00:00.000Z',
		completed_at: null,
		expires_at: null,
		...overrides,
	};
}

test('U1 builds exactly the required query', () => {
	assert.deepEqual(buildAgentRunBody(query, {}), { query });
});

test('U2 includes numeric timeout and maxSteps unchanged', () => {
	assert.deepEqual(buildAgentRunBody(query, { timeout: 60000, maxSteps: 5 }), {
		query,
		timeout: 60000,
		maxSteps: 5,
	});
});

test('U3 omits undefined timeout and maxSteps', () => {
	assert.deepEqual(buildAgentRunBody(query, { timeout: undefined, maxSteps: undefined }), {
		query,
	});
});

test('U4 omits empty string settings', () => {
	assert.deepEqual(
		buildAgentRunBody(query, { startUrl: '', profile: '', proxy: '', proxyCountry: '' }),
		{ query },
	);
});

test('U5 includes non-empty string settings', () => {
	assert.deepEqual(
		buildAgentRunBody(query, {
			startUrl: 'https://x.com',
			profile: 'p',
			proxy: 'residential',
			proxyCountry: 'US',
		}),
		{
			query,
			startUrl: 'https://x.com',
			profile: 'p',
			proxy: 'residential',
			proxyCountry: 'US',
		},
	);
});

test('U6 omits false boolean settings', () => {
	assert.deepEqual(buildAgentRunBody(query, { stealth: false, solveCaptchas: false }), { query });
});

test('U7 includes true boolean settings', () => {
	assert.deepEqual(buildAgentRunBody(query, { stealth: true, solveCaptchas: true }), {
		query,
		stealth: true,
		solveCaptchas: true,
	});
});

test('U8 trims allowed domains and drops empty entries', () => {
	assert.deepEqual(buildAgentRunBody(query, { allowedDomains: ' a.com , b.com ,, ' }), {
		query,
		allowedDomains: ['a.com', 'b.com'],
	});
});

test('U9 omits an empty allowed-domain list', () => {
	assert.deepEqual(buildAgentRunBody(query, { allowedDomains: ' , ' }), { query });
});

test('U10 omits an empty response schema', () => {
	assert.deepEqual(buildAgentRunBody(query, { responseSchema: '{}' }), { query });
});

test('U11 parses an object response schema', () => {
	assert.deepEqual(buildAgentRunBody(query, { responseSchema: '{"type":"object"}' }), {
		query,
		responseSchema: { type: 'object' },
	});
});

for (const [name, schema] of [
	['U12 unparseable', 'not json'],
	['U13 array', '[]'],
	['U14 number', '5'],
	['supplement null', 'null'],
]) {
	test(`${name} response schema throws a clear error`, () => {
		assert.throws(() => buildAgentRunBody(query, { responseSchema: schema }), /Response Schema/);
	});
}

test('U15 builds a webhook without empty events', () => {
	assert.deepEqual(buildAgentRunBody(query, { webhookUrl: 'https://h/w' }), {
		query,
		webhook: { url: 'https://h/w' },
	});
});

test('U16 builds a webhook with events', () => {
	assert.deepEqual(
		buildAgentRunBody(query, { webhookUrl: 'https://h/w', webhookEvents: ['failed'] }),
		{ query, webhook: { url: 'https://h/w', events: ['failed'] } },
	);
});

test('U17 omits webhook events when there is no URL', () => {
	assert.deepEqual(buildAgentRunBody(query, { webhookEvents: ['failed'] }), { query });
});

test('U18 never sends waitForResult', () => {
	assert.deepEqual(buildAgentRunBody(query, { waitForResult: true }), { query });
});

test('U19 computes the default wait deadline', () => {
	assert.equal(waitDeadline({}, 1000), 1000 + DEFAULT_TIMEOUT_MS + WAIT_GRACE_MS);
});

test('U20 computes a configured wait deadline', () => {
	assert.equal(waitDeadline({ timeout: 60000 }, 1000), 1000 + 60000 + WAIT_GRACE_MS);
});

test('U21 polls until a run succeeds', async () => {
	const statuses = ['running', 'succeeded'];
	let calls = 0;
	const result = await pollUntilTerminal({
		get: async () => view(statuses[calls++] ?? 'succeeded'),
		deadlineAt: 100,
		intervalMs: POLL_INTERVAL_MS,
		now: () => 0,
		sleep: async () => {},
	});
	assert.equal(result.waitTimedOut, false);
	assert.equal(result.view.status, 'succeeded');
	assert.equal(calls, 2);
});

test('U22 returns the last view when its deadline passes', async () => {
	const times = [0, 0, 100];
	let calls = 0;
	const result = await pollUntilTerminal({
		get: async () => {
			calls++;
			return view('running');
		},
		deadlineAt: 50,
		intervalMs: POLL_INTERVAL_MS,
		now: () => times.shift() ?? 100,
		sleep: async () => {},
	});
	assert.equal(result.waitTimedOut, true);
	assert.equal(result.view.status, 'running');
	assert.equal(calls, 3);
});

test('U23 returns a failed terminal view with its details', async () => {
	const failed = view('failed', { error: 'task failed', steps: ['opened page'] });
	const result = await pollUntilTerminal({
		get: async () => failed,
		deadlineAt: 100,
		intervalMs: POLL_INTERVAL_MS,
		now: () => 0,
		sleep: async () => {},
	});
	assert.deepEqual(result, { view: failed, waitTimedOut: false });
});

for (const status of TERMINAL_RUN_STATUSES) {
	test(`U24 treats ${status} as terminal`, async () => {
		const result = await pollUntilTerminal({
			get: async () => view(status),
			deadlineAt: 100,
			intervalMs: POLL_INTERVAL_MS,
			now: () => 0,
			sleep: async () => {},
		});
		assert.equal(result.waitTimedOut, false);
		assert.equal(result.view.status, status);
	});
}

test('U25 propagates a status request rejection', async () => {
	await assert.rejects(
		pollUntilTerminal({
			get: async () => {
				throw new Error('HTTP 503');
			},
			deadlineAt: 100,
			intervalMs: POLL_INTERVAL_MS,
			now: () => 0,
			sleep: async () => {},
		}),
		/HTTP 503/,
	);
});

test('U26 sleeps before every poll using the configured interval', async () => {
	const events: string[] = [];
	let calls = 0;
	await pollUntilTerminal({
		get: async () => {
			events.push('get');
			return view(++calls === 1 ? 'running' : 'succeeded');
		},
		deadlineAt: 100,
		intervalMs: POLL_INTERVAL_MS,
		now: () => 0,
		sleep: async (ms) => {
			events.push(`sleep:${ms}`);
		},
	});
	assert.deepEqual(events, [
		`sleep:${POLL_INTERVAL_MS}`,
		'get',
		`sleep:${POLL_INTERVAL_MS}`,
		'get',
	]);
});

test('U27 GET request options carry no body', () => {
	const options = buildHttpRequestOptions('GET', 'https://unit.invalid/run', { ignored: true });
	assert.equal(Object.hasOwn(options, 'body'), false);
	assert.equal(options.json, true);
});

test('U28 POST request options preserve their body and JSON mode', () => {
	const body = { value: 1 };
	const options = buildHttpRequestOptions('POST', 'https://unit.invalid/run', body);
	assert.equal(options.body, body);
	assert.equal(options.json, true);
});

const browserless = new Browserless();
const operationProperty = browserless.description.properties[0];
const operations = (operationProperty.options ?? []) as Array<{
	name: string;
	value: string;
	description?: string;
	action?: string;
}>;

test('U29 exposes exactly ten alphabetically named operations', () => {
	assert.equal(operations.length, 10);
	const names = operations.map(({ name }) => name);
	assert.deepEqual(
		names,
		[...names].sort((a, b) => a.localeCompare(b)),
	);
	assert.deepEqual(names.slice(4, 7), ['Performance Audit', 'Run Agent', 'Run Function']);
});

test('U30 exposes the complete Run Agent option', () => {
	assert.deepEqual(
		operations.find(({ value }) => value === 'agentRun'),
		{
			name: 'Run Agent',
			value: 'agentRun',
			description: 'Give the browser agent a natural-language task and return its answer',
			action: 'Run a browser agent task',
		},
	);
});

test('U31 gates every Agent field and defaults waiting to true', () => {
	const queryField = agentRunFields.find(({ name }) => name === 'query');
	const waitField = agentRunFields.find(({ name }) => name === 'waitForResult');
	assert.equal(queryField?.required, true);
	assert.equal(waitField?.type, 'boolean');
	assert.equal(waitField?.default, true);
	for (const field of agentRunFields) {
		assert.deepEqual(field.displayOptions?.show?.operation, ['agentRun']);
	}
});

test('U32 exposes the exact twelve additional settings with expected types and defaults', () => {
	const additional = agentRunFields.find(({ name }) => name === 'additionalFields');
	const settings = (additional?.options ?? []) as INodeProperties[];
	assert.deepEqual(
		settings.map(({ name, type, default: defaultValue }) => [name, type, defaultValue]),
		[
			['allowedDomains', 'string', ''],
			['maxSteps', 'number', 30],
			['profile', 'string', ''],
			['proxy', 'options', ''],
			['proxyCountry', 'string', ''],
			['responseSchema', 'json', '{}'],
			['solveCaptchas', 'boolean', false],
			['startUrl', 'string', ''],
			['stealth', 'boolean', false],
			['timeout', 'number', 900000],
			['webhookEvents', 'multiOptions', []],
			['webhookUrl', 'string', ''],
		],
	);
});

test('U33 keeps Agent Run out of shared URL and browser options', () => {
	for (const propertyName of ['url', 'options']) {
		const property = browserless.description.properties.find(({ name }) => name === propertyName);
		assert.equal(property?.displayOptions?.show?.operation?.includes('agentRun'), false);
	}
	assert.equal(operationProperty.default, 'smartScrape');
});

test('U34 injects credentials through the authenticated query parameter', () => {
	const credential = new BrowserlessApi();
	assert.equal(credential.authenticate.properties.qs.token, '={{$credentials.token}}');
});

test('U35 documents Run Agent and removes stale operation entries', () => {
	const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
	const operationsSection =
		readme.split('## Operations')[1]?.split('## Agentic browsing (MCP)')[0] ?? '';
	assert.match(operationsSection, /\*\*Run Agent\*\*/);
	for (const stale of ['Get Content', 'Scrape', 'Unblock'])
		assert.doesNotMatch(operationsSection, new RegExp(`\\*\\*${stale}\\*\\*`));
	assert.match(readme, /Run Agent.*self-contained task over REST/);
});

test('supplement spreads Agent fields into the node description', () => {
	for (const field of agentRunFields) {
		const registered = browserless.description.properties.find(
			({ name, displayOptions }) =>
				name === field.name && displayOptions?.show?.operation?.includes('agentRun'),
		);
		assert.deepEqual(registered, field);
	}
});

test('supplement dispatches Agent Run and preserves paired-item metadata', async () => {
	let captured: IHttpRequestOptions | undefined;
	const context = {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name: string) => {
			if (name === 'operation') return 'agentRun';
			if (name === 'query') return query;
			if (name === 'waitForResult') return false;
			if (name === 'additionalFields') return {};
			throw new Error(`Unexpected parameter: ${name}`);
		},
		getCredentials: async () => ({ url: 'https://unit.invalid', token: 'redacted' }),
		getNode: () => ({ name: 'Browserless' }),
		continueOnFail: () => false,
		helpers: {
			httpRequestWithAuthentication: async (_credential: string, options: IHttpRequestOptions) => {
				captured = options;
				return { id: 'run_unit', status: 'pending' };
			},
		},
	} as unknown as IExecuteFunctions;

	const result = await browserless.execute.call(context);
	assert.deepEqual(result, [
		[{ json: { id: 'run_unit', status: 'pending' }, pairedItem: { item: 0 } }],
	]);
	assert.equal(captured?.method, 'POST');
	assert.equal(captured?.url, 'https://unit.invalid/agent/run');
});
