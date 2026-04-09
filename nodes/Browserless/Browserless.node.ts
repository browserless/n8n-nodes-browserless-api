import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { getUrlField, getWaitOptions } from './shared/descriptions';

import { contentFields } from './operations/content/description';
import { scrapeFields } from './operations/scrape/description';
import { smartScrapeFields } from './operations/smartScrape/description';
import { screenshotFields } from './operations/screenshot/description';
import { pdfFields } from './operations/pdf/description';
import { searchFields } from './operations/search/description';
import { mapFields } from './operations/map/description';
import { functionFields } from './operations/function/description';
import { downloadFields } from './operations/download/description';
import { exportFields } from './operations/export/description';
import { unblockFields } from './operations/unblock/description';
import { performanceFields } from './operations/performance/description';
import { crawlFields } from './operations/crawl/description';

import { execute as executeContent } from './operations/content/execute';
import { execute as executeScrape } from './operations/scrape/execute';
import { execute as executeSmartScrape } from './operations/smartScrape/execute';
import { execute as executeScreenshot } from './operations/screenshot/execute';
import { execute as executePdf } from './operations/pdf/execute';
import { execute as executeSearch } from './operations/search/execute';
import { execute as executeMap } from './operations/map/execute';
import { execute as executeFunction } from './operations/function/execute';
import { execute as executeDownload } from './operations/download/execute';
import { execute as executeExport } from './operations/export/execute';
import { execute as executeUnblock } from './operations/unblock/execute';
import { execute as executePerformance } from './operations/performance/execute';
import { execute as executeCrawl } from './operations/crawl/execute';

// Operations that accept a URL parameter
const URL_OPERATIONS = [
	'getContent',
	'scrape',
	'smartScrape',
	'screenshot',
	'pdf',
	'mapUrls',
	'exportContent',
	'unblock',
	'performanceAudit',
	'crawl',
];

// Operations that accept the shared wait/navigation options
const WAIT_OPERATIONS = [
	'getContent',
	'scrape',
	'smartScrape',
	'screenshot',
	'pdf',
	'unblock',
	'crawl',
];

export class Browserless implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Browserless',
		name: 'browserless',
		icon: 'file:browserless.svg',
		group: ['transform'],
		version: [1],
		subtitle: '={{ $parameter["operation"] }}',
		description: 'Interact with the Browserless headless browser API',
		defaults: {
			name: 'Browserless',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'browserlessApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Crawl',
						value: 'crawl',
						description: 'Crawl a website and extract content from every page',
						action: 'Crawl a website',
					},
					{
						name: 'Download',
						value: 'download',
						description: 'Download a file triggered by browser automation',
						action: 'Download a file',
					},
					{
						name: 'Export',
						value: 'exportContent',
						description: 'Fetch a URL and stream it in its native content type',
						action: 'Export page content',
					},
					{
						name: 'Get Content',
						value: 'getContent',
						description: 'Get the fully rendered HTML of a page',
						action: 'Get page content',
					},
					{
						name: 'Map URLs',
						value: 'mapUrls',
						description: 'Discover URLs on a site or within its sitemap',
						action: 'Discover links on a site',
					},
					{
						name: 'PDF',
						value: 'pdf',
						description: 'Generate a PDF document from a web page',
						action: 'Generate a PDF',
					},
					{
						name: 'Performance Audit',
						value: 'performanceAudit',
						description: 'Run Lighthouse audits for performance, SEO, and accessibility',
						action: 'Run a performance audit',
					},
					{
						name: 'Run Function',
						value: 'runFunction',
						description: 'Execute custom JavaScript/Puppeteer code server-side',
						action: 'Run a custom function',
					},
					{
						name: 'Scrape',
						value: 'scrape',
						description: 'Extract structured data from a page using CSS selectors',
						action: 'Scrape structured data',
					},
					{
						name: 'Screenshot',
						value: 'screenshot',
						description: 'Capture a screenshot of a page as PNG, JPEG, or WebP',
						action: 'Take a screenshot',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search the web and return results',
						action: 'Search the web',
					},
					{
						name: 'Smart Scrape',
						value: 'smartScrape',
						description:
							'Scrape a page with automatic fallbacks for blocked or JS-heavy sites',
						action: 'Smart scrape a page',
					},
					{
						name: 'Unblock',
						value: 'unblock',
						description: 'Bypass CAPTCHAs and bot detection to access a page',
						action: 'Unblock a page',
					},
				],
				default: 'getContent',
			},

			// Shared URL field for operations that need it
			getUrlField(URL_OPERATIONS),

			// Shared wait/navigation options
			getWaitOptions(WAIT_OPERATIONS),

			// Operation-specific fields
			...contentFields,
			...scrapeFields,
			...smartScrapeFields,
			...screenshotFields,
			...pdfFields,
			...searchFields,
			...mapFields,
			...functionFields,
			...downloadFields,
			...exportFields,
			...unblockFields,
			...performanceFields,
			...crawlFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				let result: INodeExecutionData[];

				switch (operation) {
					case 'getContent':
						result = await executeContent.call(this, i);
						break;
					case 'scrape':
						result = await executeScrape.call(this, i);
						break;
					case 'smartScrape':
						result = await executeSmartScrape.call(this, i);
						break;
					case 'screenshot':
						result = await executeScreenshot.call(this, i);
						break;
					case 'pdf':
						result = await executePdf.call(this, i);
						break;
					case 'search':
						result = await executeSearch.call(this, i);
						break;
					case 'mapUrls':
						result = await executeMap.call(this, i);
						break;
					case 'runFunction':
						result = await executeFunction.call(this, i);
						break;
					case 'download':
						result = await executeDownload.call(this, i);
						break;
					case 'exportContent':
						result = await executeExport.call(this, i);
						break;
					case 'unblock':
						result = await executeUnblock.call(this, i);
						break;
					case 'performanceAudit':
						result = await executePerformance.call(this, i);
						break;
					case 'crawl':
						result = await executeCrawl.call(this, i);
						break;
					default:
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported`,
							{ itemIndex: i },
						);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}

				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
