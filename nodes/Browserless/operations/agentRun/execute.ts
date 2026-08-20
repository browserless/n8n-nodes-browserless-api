import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { sleep } from 'n8n-workflow';
import { browserlessApiRequest } from '../../shared/transport';
import {
	buildAgentRunBody,
	POLL_INTERVAL_MS,
	pollUntilTerminal,
	waitDeadline,
	type AgentRunCreated,
	type AgentRunView,
} from './helpers';

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const query = this.getNodeParameter('query', index) as string;
	const waitForResult = this.getNodeParameter('waitForResult', index, true) as boolean;
	const additionalFields = this.getNodeParameter('additionalFields', index, {}) as Record<
		string,
		unknown
	>;
	const body = buildAgentRunBody(query, additionalFields);
	const created = (await browserlessApiRequest.call(
		this,
		'POST',
		'/agent/run',
		body,
	)) as AgentRunCreated;

	if (!waitForResult) {
		return [{ json: created as unknown as IDataObject, pairedItem: { item: index } }];
	}

	const { view, waitTimedOut } = await pollUntilTerminal({
		get: () =>
			browserlessApiRequest.call(
				this,
				'GET',
				`/agent/run/${encodeURIComponent(created.id)}`,
			) as Promise<AgentRunView>,
		deadlineAt: waitDeadline(additionalFields, Date.now()),
		intervalMs: POLL_INTERVAL_MS,
		now: () => Date.now(),
		sleep,
	});

	const json = waitTimedOut ? { ...view, waitTimedOut: true } : view;
	return [{ json: json as unknown as IDataObject, pairedItem: { item: index } }];
}
