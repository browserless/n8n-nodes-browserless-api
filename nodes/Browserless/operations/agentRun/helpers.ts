export interface AgentRunCreated {
	id: string;
	status: string;
}

export interface AgentRunView {
	id: string;
	status: string;
	data: unknown;
	error: string | null;
	steps: string[];
	turns: unknown[];
	created_at: string;
	completed_at: string | null;
	expires_at: string | null;
}

export const DEFAULT_TIMEOUT_MS = 900000;
export const WAIT_GRACE_MS = 30000;
export const POLL_INTERVAL_MS = 3000;
export const TERMINAL_RUN_STATUSES: ReadonlySet<string> = new Set([
	'succeeded',
	'failed',
	'timed_out',
	'stopped',
	'capped',
]);

export function buildAgentRunBody(
	query: string,
	fields: Record<string, unknown>,
): Record<string, unknown> {
	const body: Record<string, unknown> = { query };

	if (typeof fields.timeout === 'number') body.timeout = fields.timeout;
	if (typeof fields.maxSteps === 'number') body.maxSteps = fields.maxSteps;

	for (const key of ['startUrl', 'profile', 'proxy', 'proxyCountry']) {
		if (typeof fields[key] === 'string' && fields[key].length > 0) body[key] = fields[key];
	}

	if (fields.stealth) body.stealth = true;
	if (fields.solveCaptchas) body.solveCaptchas = true;

	if (typeof fields.allowedDomains === 'string' && fields.allowedDomains.length > 0) {
		const allowedDomains = fields.allowedDomains
			.split(',')
			.map((domain) => domain.trim())
			.filter(Boolean);
		if (allowedDomains.length > 0) body.allowedDomains = allowedDomains;
	}

	if (typeof fields.responseSchema === 'string' && fields.responseSchema.length > 0) {
		try {
			const responseSchema = JSON.parse(fields.responseSchema) as unknown;
			if (
				responseSchema === null ||
				typeof responseSchema !== 'object' ||
				Array.isArray(responseSchema)
			) {
				throw new Error();
			}
			if (Object.keys(responseSchema).length > 0) body.responseSchema = responseSchema;
		} catch {
			// eslint-disable-next-line @n8n/community-nodes/require-node-api-error -- kept dependency-free for Node's type-stripped unit tests; the node dispatcher wraps this error
			throw new Error('Response Schema must be valid JSON');
		}
	}

	if (typeof fields.webhookUrl === 'string' && fields.webhookUrl.length > 0) {
		const webhook: Record<string, unknown> = { url: fields.webhookUrl };
		if (Array.isArray(fields.webhookEvents) && fields.webhookEvents.length > 0) {
			webhook.events = fields.webhookEvents;
		}
		body.webhook = webhook;
	}

	return body;
}

export function waitDeadline(fields: Record<string, unknown>, startedAt: number): number {
	const timeout = typeof fields.timeout === 'number' ? fields.timeout : DEFAULT_TIMEOUT_MS;
	return startedAt + timeout + WAIT_GRACE_MS;
}

export async function pollUntilTerminal(opts: {
	get: () => Promise<AgentRunView>;
	deadlineAt: number;
	intervalMs: number;
	now: () => number;
	sleep: (ms: number) => Promise<void>;
}): Promise<{ view: AgentRunView; waitTimedOut: boolean }> {
	while (true) {
		await opts.sleep(opts.intervalMs);
		const view = await opts.get();

		if (TERMINAL_RUN_STATUSES.has(view.status)) {
			return { view, waitTimedOut: false };
		}
		if (opts.now() >= opts.deadlineAt) {
			return { view, waitTimedOut: true };
		}
	}
}
