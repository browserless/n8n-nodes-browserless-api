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
  keys, YAML merge keys/tags, and `%YAML` directives; ordinary anchors/aliases
  remain supported. Remove the guard only after an upgraded analyzer catches
  the same regression cases.
- actionlint 1.7.12 skips some remote-action input schemas at full-semver refs.
  Review those inputs manually; there are no global input/runner suppressions.
- Publication retains `NPM_TOKEN` authentication and OIDC for `--provenance`.
  Dependency execution and packing occur in a separate job without either
  identity. The privileged job publishes the checksum-verified same-run tarball
  with `--ignore-scripts`, without rebuilding. As before, `prepublishOnly` does
  not run. Tarball publication omits `gitHead`; provenance identifies the commit.
  Do not change credentials without an approved, empirically verified migration.
