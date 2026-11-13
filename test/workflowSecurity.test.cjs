const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { load, dump, JSON_SCHEMA } = require('js-yaml');

// This is a CI policy guard, independent of zizmor's incomplete cooldown audit.
function checkCooldowns(source) {
	assert(!/^\uFEFF?%YAML\b/m.test(source), 'YAML version directives are not supported');
	const config = load(source, { schema: JSON_SCHEMA });
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
			assert(Number.isInteger(days) && days >= 3, `${update['package-ecosystem']}: ${key}`);
		}
	}
}

const baseline = readFileSync('.github/dependabot.yml', 'utf8');

test('every Dependabot updater has an unfiltered cooldown of at least three days', () => {
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
		for (const delay of [0, 2, 3.5, '3', null]) {
			rejects((entry) => (entry.cooldown['default-days'] = delay), `default-days ${delay}`);
		}
		for (const key of ['semver-major-days', 'semver-minor-days', 'semver-patch-days']) {
			for (const delay of [0, 2, 3.5, '3', null]) {
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
		valid.updates[index].cooldown['default-days'] = 4;
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
	]) {
		assert.throws(() => checkCooldowns(source), source);
	}
});
