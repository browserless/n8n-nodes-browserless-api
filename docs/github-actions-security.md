# GitHub Actions security maintenance

## Tool update procedure

Pins live in `.github/workflows/ci.yml`. Dependabot maintains action references
and existing `actions.lock` entries, not shell download URLs or checksums.

- **gh-actions-lock v0.4.1:** review the replacement release and update `--pin`.
  Use the same version locally. v0.4.1 is an immutable release; confirm that
  property before updating. Extension installation has no separate checksum step.
- **zizmor 1.32.0, actionlint 1.7.12, ShellCheck 0.11.0:** review the release and
  verify the Linux x86-64 archive against publisher checksums/signatures where
  available. Update the version, URL, extraction path, and literal SHA-256
  together. Verify before extracting or executing. Keep zizmor at least 1.32.0
  for lockfile support.

After workflow edits, regenerate the lockfile last. Review resolved commits and
repository/owner identities; commit workflows and lockfile together. Never edit
the lockfile by hand. With the pinned tools and ShellCheck on PATH, run at root:

```sh
gh actions-lock
gh actions-lock --verify
zizmor .
actionlint
npm test
npm run lint
npm run build
```

These checks run in PR CI, independently of local hooks. Review inputs against
each locked action's `action.yml` and revisit exceptions after tool updates.

## Exceptions and limitations

- `.github/zizmor.yml` sets the approved three-day minimum instead of seven.
  `test/workflowSecurity.test.cjs` checks every updater because zizmor 1.32.0
  stops after its first compliant entry and does not fully enforce explicit
  cooldowns, SemVer overrides, or filters. The guard rejects unknown cooldown
  keys, non-integer or out-of-range (3–90 days) delays, YAML merge keys/tags,
  `%YAML` directives, and a competing `dependabot.yaml`; ordinary anchors/aliases
  remain supported. Remove it only after an upgraded analyzer catches these cases.
- actionlint 1.7.12 skips some remote-action input schemas at full-semver refs.
  Review those inputs manually; there are no global input/runner suppressions.
- Publication retains `NPM_TOKEN` authentication and OIDC for `--provenance`.
  Dependency execution and packing occur in a separate job without either
  identity. That job controls the entire tarball, so the privileged job checks
  name/version with npm's own parser, not a literal tar member:
  `npm pack <tgz> --dry-run --json --ignore-scripts`. The checksum ensures
  same-run byte integrity, not trusted contents. Publication uses `--ignore-scripts`
  without rebuilding or checking out source. As before, `prepublishOnly` does
  not run. Stable releases use npm's implicit `latest` guard; prereleases use
  `--tag next`. Tarball publication omits `gitHead`; provenance identifies the commit.
  Do not change credentials without an approved, empirically verified migration.
- Future release tags are **`v<package.json version>` only**, matching the
  v-prefixed release convention in sibling repositories. Historical unprefixed
  tags remain unchanged; release-it now produces v-prefixed tags. Administrator
  follow-up must use **`v*` for both the tag ruleset (create/update/delete) and the
  `npm` environment's tag deployment policy**, without required reviewers.
  Before requiring main's checks, accommodate the direct-push release actor
  with an approved bypass or switch to PR-based release commits: a non-atomic
  `--follow-tags` push can otherwise publish a tag without its main commit.
- Environment attachment remains deferred: configure the tag protections, move
  `NPM_TOKEN` into the `npm` environment, attach only `publish` to it, and delete
  the repository-level secret in a coordinated administrator follow-up. Until
  deletion, branch workflows can still access the repository secret. Treat token
  scope/expiry validation (granular write access to this package only) as a
  **release blocker**, then separately authorize a prerelease canary on `next`.
  Token-based CI published the former scoped package in April 2026, but every
  post-rename CI run failed; historical success does not validate today's secret.
