Common commands (Windows, run from repo root):
- Install deps: npm install
- Dev all apps: npm run dev
- Dev single app: npm run dev -- --filter=admin-web (or resident-app, staff-app, api)
- Build: npm run build (or build:admin-web, build:resident-app, build:staff-app, build:api)
- Lint: npm run lint (fix: npm run lint:fix)
- Type check: npm run type-check
- Tests: npm run test
- E2E tests: npm run test:e2e (Turbo task must exist in turbo.json)
- DB: npm run db:generate | db:migrate | db:push | db:seed | db:studio
- Deploy scripts: ./scripts/setup-production.sh, ./scripts/deploy-db.sh, ./scripts/smoke-test.sh
Note: npm is the workspace package manager (packageManager: npm@10).