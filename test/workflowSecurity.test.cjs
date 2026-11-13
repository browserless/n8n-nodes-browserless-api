const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const {
	existsSync,
	mkdtempSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');
const { load, dump, FAILSAFE_SCHEMA, types } = require('js-yaml');

// This is a CI policy guard, independent of zizmor's incomplete cooldown audit.
function checkCooldowns(source) {
	assert(!/^\uFEFF?%YAML\b/m.test(source), 'YAML version directives are not supported');
	// Omit float resolution: 3.0 and 3e0 must not become integer-valued numbers.
	const config = load(source, {
		schema: FAILSAFE_SCHEMA.extend({ implicit: [types.null, types.bool, types.int] }),
	});
	const visited = new Set();
	const rejectMerges = (value) => {
		if (!value || typeof value !== 'object' || visited.has(value)) return;
		visited.add(value);
		assert(!Object.hasOwn(value, '<<'), 'YAML merge keys are not supported');
		Object.values(value).forEach(rejectMerges);
	};
	rejectMerges(config);
	assert(Array.isArray(config?.updates), 'Dependabot updates must be an array');
	for (const ecosystem of ['npm', 'github-actions']) {
		assert(config.updates.some((entry) => entry?.['package-ecosystem'] === ecosystem));
	}
	for (const update of config.updates) {
		const cooldown = update?.cooldown;
		assert(cooldown && typeof cooldown === 'object' && !Array.isArray(cooldown));
		assert(Number.isInteger(cooldown['default-days']) && cooldown['default-days'] >= 3);
		for (const [key, days] of Object.entries(cooldown)) {
			assert(/^(default-days|semver-(major|minor|patch)-days)$/.test(key), key);
			assert(
				Number.isInteger(days) && days >= 3 && days <= 90,
				`${update['package-ecosystem']}: ${key}`,
			);
		}
	}
}

const baseline = readFileSync('.github/dependabot.yml', 'utf8');

test('every Dependabot updater has an unfiltered cooldown of at least three days', () => {
	assert(!existsSync('.github/dependabot.yaml'), 'use only .github/dependabot.yml');
	checkCooldowns(baseline);
});

test('cooldown guard rejects per-updater and YAML bypasses', () => {
	// Mutate each entry independently, without the baseline's shared aliases.
	for (const index of [0, 1, 2]) {
		const config = () => {
			const value = JSON.parse(JSON.stringify(load(baseline)));
			value.updates.push({
				'package-ecosystem': 'docker',
				directory: '/',
				schedule: { interval: 'weekly' },
				cooldown: { 'default-days': 3 },
			});
			return value;
		};
		const rejects = (change, name) => {
			const value = config();
			change(value.updates[index]);
			assert.throws(() => checkCooldowns(dump(value)), `${index}: ${name}`);
		};
		rejects((entry) => delete entry.cooldown, 'missing cooldown');
		for (const delay of [0, 2, 3.5, 91, 4000, '3', null]) {
			rejects((entry) => (entry.cooldown['default-days'] = delay), `default-days ${delay}`);
		}
		for (const key of ['semver-major-days', 'semver-minor-days', 'semver-patch-days']) {
			for (const delay of [0, 2, 3.5, 91, 4000, '3', null]) {
				rejects((entry) => (entry.cooldown[key] = delay), `${key} ${delay}`);
			}
			const valid = config();
			valid.updates[index].cooldown[key] = 3;
			checkCooldowns(dump(valid));
		}
		for (const key of ['include', 'exclude', 'unknown-days', '<<', 'semver-major-days\n']) {
			rejects((entry) => (entry.cooldown[key] = 3), `unsupported ${key}`);
		}
		for (const key of ['include', 'exclude']) {
			rejects((entry) => (entry.cooldown[key] = ['*']), `filtered ${key}`);
		}
		for (const cooldown of [null, [], 3, { 'semver-major-days': 3 }]) {
			rejects((entry) => (entry.cooldown = cooldown), 'invalid cooldown shape');
		}
		const valid = config();
		valid.updates[index].cooldown['default-days'] = 90;
		checkCooldowns(dump(valid));
	}
	for (const ecosystem of ['npm', 'github-actions']) {
		const config = load(baseline);
		config.updates = config.updates.filter((entry) => entry['package-ecosystem'] !== ecosystem);
		assert.throws(() => checkCooldowns(dump(config)), `missing ${ecosystem}`);
	}
	for (const source of [
		'%YAML 1.1\n---\n' + baseline,
		'\uFEFF%YAML 1.2\n---\n' + baseline,
		'%YAML 1.2\n---\n' + baseline,
		baseline + '\n<<: { updates: [] }\n',
		baseline.replace('default-days: 3', '<<: { default-days: 3 }'),
		baseline.replace('default-days: 3', '? !!merge <<\n      : { default-days: 3 }'),
		baseline.replace('default-days: 3', 'default-days: 3\n      default-days: 0'),
		baseline.replace('default-days: 3', 'default-days: !custom 3'),
		...['3.0', '3e0', '30e-1'].map((days) =>
			baseline.replace('default-days: 3', `default-days: ${days}`),
		),
	]) {
		assert.throws(() => checkCooldowns(source), source);
	}
});

test('publish verification rejects manifest aliases interpreted differently by npm', () => {
	const workflow = load(readFileSync('.github/workflows/publish.yml', 'utf8'));
	const script = workflow.jobs.publish.steps.find(
		(step) => step.name === 'Verify the prepared package',
	).run;
	const root = mkdtempSync(join(tmpdir(), 'publish-manifest-'));
	const run = (command, args, env = {}) =>
		spawnSync(command, args, {
			cwd: root,
			env: {
				PATH: process.env.PATH,
				HOME: root,
				RUNNER_TEMP: root,
				GITHUB_ENV: join(root, 'env'),
				npm_config_registry: 'http://127.0.0.1:9',
				npm_config_fetch_retries: '0',
				...env,
			},
			encoding: 'utf8',
		});
	const ok = (result) => assert.equal(result.status, 0, result.stdout + result.stderr);
	try {
		mkdirSync(join(root, 'npm-package'));
		mkdirSync(join(root, 'package'));
		mkdirSync(join(root, 'zzz'));
		const pkg = { name: 'n8n-nodes-browserless-api', version: '1.3.0' };
		const canary = "node -e \"require('fs').writeFileSync('canary', 'ran')\"";
		writeFileSync(
			join(root, 'package.json'),
			JSON.stringify({ ...pkg, scripts: { prepack: canary, prepare: canary } }),
		);
		ok(run('npm', ['pack', '--ignore-scripts', '--pack-destination', 'npm-package']));
		const archive = join(root, 'npm-package', `${pkg.name}-${pkg.version}.tgz`);
		const verify = (tag = `v${pkg.version}`) =>
			run('bash', ['-e', '-o', 'pipefail', '-c', script], {
				TAG: tag,
				PACKAGE_SHA256: createHash('sha256').update(readFileSync(archive)).digest('hex'),
			});
		ok(verify());
		assert.notEqual(verify(pkg.version).status, 0, 'unprefixed release tag');
		writeFileSync(join(root, 'package/package.json'), JSON.stringify(pkg));
		for (const [alias, impostor] of [
			['zzz/package.json', { ...pkg, name: 'different-package' }],
			['package/./package.json', { ...pkg, version: '9.9.9' }],
		]) {
			writeFileSync(join(root, 'zzz/package.json'), JSON.stringify(impostor));
			ok(
				run('tar', [
					'-czf',
					archive,
					`--transform=s|^zzz/package.json$|${alias}|`,
					'package/package.json',
					'zzz/package.json',
				]),
			);
			assert.notEqual(verify().status, 0, `must reject npm manifest alias ${alias}`);
		}
		assert(!existsSync(join(root, 'canary')), 'verification must not run lifecycle scripts');
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
