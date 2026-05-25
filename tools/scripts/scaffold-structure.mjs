#!/usr/bin/env node
/**
 * Road Guard — Monorepo structure scaffolder
 * Generates directories and placeholder files (no business logic).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const APPS = {
  'api-gateway': {
    port: 3000,
    modules: ['routing', 'auth-proxy', 'rate-limit', 'versioning', 'health'],
    gateway: true,
  },
  'auth-service': {
    port: 3001,
    modules: [
      'password-auth',
      'otp-auth',
      'oauth-social',
      'sessions',
      'refresh-tokens',
      'devices',
      'rbac',
      'mfa',
      'password-reset',
      'account-lockout',
    ],
  },
  'user-service': {
    port: 3002,
    modules: ['profiles', 'addresses', 'emergency-contacts', 'preferences', 'memberships', 'referrals', 'consents'],
  },
  'provider-service': {
    port: 3003,
    modules: ['onboarding', 'kyc', 'documents', 'availability', 'service-areas', 'ratings', 'earnings', 'payouts', 'fleet-providers'],
  },
  'vehicle-service': {
    port: 3004,
    modules: ['vehicles', 'insurance', 'documents', 'maintenance-history', 'inspections', 'telematics'],
  },
  'breakdown-service': {
    port: 3005,
    modules: ['requests', 'dispatch', 'lifecycle', 'cancellations', 'feedback', 'ai-diagnosis-orchestration'],
  },
  'tracking-service': {
    port: 3006,
    modules: ['gps-ingest', 'live-routes', 'eta', 'geofencing', 'replay', 'heatmaps'],
  },
  'payment-service': {
    port: 3007,
    modules: ['wallets', 'subscriptions', 'invoices', 'payouts', 'refunds', 'gateways', 'disputes', 'tax'],
  },
  'notification-service': {
    port: 3008,
    modules: ['push', 'sms', 'whatsapp', 'email', 'in-app', 'templates', 'preferences', 'delivery-tracking', 'digest-engine'],
  },
  'ai-service': {
    port: 3009,
    modules: [
      'chat-assistant',
      'voice-assistant',
      'image-diagnosis',
      'rag',
      'agents',
      'prompt-registry',
      'multilingual',
      'safety-guardrails',
      'feedback-loop',
      'model-router',
    ],
  },
  'media-service': {
    port: 3010,
    modules: ['uploads', 'presigned-urls', 'transcoding', 'image-processing', 'cdn-invalidation', 'virus-scan', 'metadata-extraction'],
  },
  'analytics-service': {
    port: 3011,
    modules: ['dashboards', 'kpis', 'reports', 'funnels', 'cohorts', 'ai-analytics', 'etl', 'data-export'],
  },
  'admin-service': {
    port: 3012,
    modules: ['admins', 'cms', 'moderation', 'audit-logs', 'feature-flags', 'system-config', 'support-tools', 'impersonation'],
  },
  'realtime-service': {
    port: 3013,
    modules: ['socket-gateway', 'presence', 'rooms', 'chat', 'live-tracking-bridge', 'notifications-bridge'],
    realtime: true,
  },
};

const PACKAGES = [
  'config',
  'database',
  'logger',
  'cache',
  'messaging',
  'auth',
  'types',
  'utils',
  'validators',
  'contracts',
  'events',
  'ai-core',
  'monitoring',
  'shared-business',
];

const SERVICE_LAYERS = [
  'src/main.ts',
  'src/app.ts',
  'src/server.ts',
  'src/controllers/.gitkeep',
  'src/routes/v1/.gitkeep',
  'src/routes/v2/.gitkeep',
  'src/services/.gitkeep',
  'src/repositories/.gitkeep',
  'src/schemas/.gitkeep',
  'src/models/.gitkeep',
  'src/dtos/.gitkeep',
  'src/validators/.gitkeep',
  'src/middleware/auth.middleware.ts',
  'src/middleware/rbac.middleware.ts',
  'src/middleware/tenant.middleware.ts',
  'src/middleware/rate-limit.middleware.ts',
  'src/middleware/error.middleware.ts',
  'src/middleware/correlation.middleware.ts',
  'src/middleware/audit.middleware.ts',
  'src/middleware/validation.middleware.ts',
  'src/events/producers/.gitkeep',
  'src/events/consumers/.gitkeep',
  'src/events/handlers/.gitkeep',
  'src/events/schemas/.gitkeep',
  'src/sockets/gateways/.gitkeep',
  'src/sockets/namespaces/.gitkeep',
  'src/sockets/rooms/.gitkeep',
  'src/sockets/handlers/.gitkeep',
  'src/sockets/middleware/.gitkeep',
  'src/queues/producers/.gitkeep',
  'src/queues/workers/.gitkeep',
  'src/queues/processors/.gitkeep',
  'src/jobs/scheduler.ts',
  'src/jobs/definitions/.gitkeep',
  'src/workers/.gitkeep',
  'src/adapters/http/.gitkeep',
  'src/adapters/grpc/.gitkeep',
  'src/adapters/kafka/.gitkeep',
  'src/adapters/redis/.gitkeep',
  'src/adapters/s3/.gitkeep',
  'src/adapters/twilio/.gitkeep',
  'src/adapters/stripe/.gitkeep',
  'src/adapters/openai/.gitkeep',
  'src/integrations/maps/.gitkeep',
  'src/integrations/kyc/.gitkeep',
  'src/integrations/insurance/.gitkeep',
  'src/integrations/telematics/.gitkeep',
  'src/policies/.gitkeep',
  'src/permissions/.gitkeep',
  'src/config/index.ts',
  'src/config/database.config.ts',
  'src/config/redis.config.ts',
  'src/config/kafka.config.ts',
  'src/config/openapi.config.ts',
  'src/config/feature-flags.ts',
  'src/container/container.ts',
  'src/container/tokens.ts',
  'src/infrastructure/http/.gitkeep',
  'src/infrastructure/persistence/.gitkeep',
  'src/infrastructure/messaging/.gitkeep',
  'src/infrastructure/cache/.gitkeep',
  'src/domain/entities/.gitkeep',
  'src/domain/value-objects/.gitkeep',
  'src/domain/aggregates/.gitkeep',
  'src/domain/repositories/.gitkeep',
  'src/domain/services/.gitkeep',
  'src/domain/events/.gitkeep',
  'src/application/commands/.gitkeep',
  'src/application/queries/.gitkeep',
  'src/application/handlers/.gitkeep',
  'src/interfaces/.gitkeep',
  'src/constants/.gitkeep',
  'src/errors/.gitkeep',
  'src/types/.gitkeep',
  'src/utils/.gitkeep',
  'tests/unit/.gitkeep',
  'tests/integration/.gitkeep',
  'tests/e2e/.gitkeep',
  'tests/contract/.gitkeep',
  'tests/load/.gitkeep',
  'tests/fixtures/.gitkeep',
  'docs/README.md',
  'docs/openapi.yaml',
  'docs/asyncapi.yaml',
  'docs/erd.md',
  'docs/runbook.md',
  'migrations/.gitkeep',
  'Dockerfile',
  '.dockerignore',
  'package.json',
  'tsconfig.json',
  'jest.config.ts',
  'nodemon.json',
  'README.md',
];

const MODULE_FILES = (feature) => [
  `src/modules/${feature}/${feature}.module.ts`,
  `src/modules/${feature}/${feature}.controller.ts`,
  `src/modules/${feature}/${feature}.routes.ts`,
  `src/modules/${feature}/${feature}.service.ts`,
  `src/modules/${feature}/${feature}.repository.ts`,
  `src/modules/${feature}/${feature}.schema.ts`,
  `src/modules/${feature}/${feature}.dto.ts`,
  `src/modules/${feature}/${feature}.validator.ts`,
  `src/modules/${feature}/${feature}.mapper.ts`,
  `src/modules/${feature}/${feature}.policy.ts`,
  `src/modules/${feature}/events/${feature}.producer.ts`,
  `src/modules/${feature}/events/${feature}.consumer.ts`,
  `src/modules/${feature}/__tests__/unit/.gitkeep`,
  `src/modules/${feature}/__tests__/integration/.gitkeep`,
  `src/modules/${feature}/__tests__/fixtures/.gitkeep`,
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeFile(relPath, content) {
  const full = path.join(ROOT, relPath);
  if (fs.existsSync(full)) return;
  ensureDir(full);
  fs.writeFileSync(full, content, 'utf8');
}

function touchGitkeep(relDir) {
  writeFile(path.join(relDir, '.gitkeep'), '');
}

function scaffoldService(name, config) {
  const base = `apps/${name}`;
  for (const layer of SERVICE_LAYERS) {
    const rel = `${base}/${layer}`;
    if (layer.endsWith('.gitkeep')) {
      touchGitkeep(rel.replace('/.gitkeep', ''));
    } else if (layer.endsWith('.ts') || layer.endsWith('.yaml') || layer.endsWith('.md')) {
      const stub = getServiceFileStub(name, layer, config);
      writeFile(rel, stub);
    }
  }
  for (const mod of config.modules) {
    for (const f of MODULE_FILES(mod)) {
      writeFile(`${base}/${f}`, getModuleStub(name, mod, f));
    }
  }
}

function getModuleStub(service, feature, filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  return `/**
 * ${service} / ${feature}
 * Scaffold placeholder — implement business logic in a future phase.
 * @module ${feature}
 */\n\nexport {};\n`;
}

function getServiceFileStub(service, layer, config) {
  if (layer === 'src/main.ts') {
    return `/**
 * ${service} entrypoint
 * Bootstrap: load config, wire DI, start server.
 */\n\n// TODO: wire container and start server\n`;
  }
  if (layer === 'src/app.ts') {
    return `/**
 * ${service} HTTP application factory (Express/Fastify).
 */\n\n// TODO: register routes and middleware\n`;
  }
  if (layer === 'src/server.ts') {
    return `/**
 * ${service} server lifecycle (listen, graceful shutdown, health).
 */\n\n// TODO: implement lifecycle hooks\n`;
  }
  if (layer.endsWith('middleware.ts')) {
    return `/**\n * ${service} — ${path.basename(layer)}\n */\n\n// TODO: implement middleware\n`;
  }
  if (layer === 'src/jobs/scheduler.ts') {
    return `/**\n * ${service} — cron scheduler\n */\n\n// TODO: register scheduled jobs\n`;
  }
  if (layer === 'src/container/container.ts') {
    return `/**\n * ${service} — DI container wiring\n */\n\n// TODO: register dependencies\n`;
  }
  if (layer === 'src/container/tokens.ts') {
    return `/**\n * ${service} — DI tokens\n */\n\nexport const TOKENS = {} as const;\n`;
  }
  if (layer.startsWith('src/config/')) {
    return `/**\n * ${service} — ${path.basename(layer)}\n */\n\nexport {};\n`;
  }
  if (layer === 'package.json') {
    return JSON.stringify(
      {
        name: `@roadguard/${service}`,
        version: '0.0.1',
        private: true,
        description: `Road Guard — ${service}`,
        main: 'dist/main.js',
        scripts: {
          dev: 'nodemon',
          build: 'tsc -p tsconfig.json',
          start: 'node dist/main.js',
          test: 'jest',
          'test:watch': 'jest --watch',
          lint: 'eslint src --ext .ts',
          'typecheck': 'tsc --noEmit',
        },
        dependencies: {
          '@roadguard/config': 'workspace:*',
          '@roadguard/logger': 'workspace:*',
          '@roadguard/types': 'workspace:*',
        },
        devDependencies: {
          '@types/node': '^20.0.0',
          nodemon: '^3.0.0',
          typescript: '^5.4.0',
          jest: '^29.0.0',
          'ts-jest': '^29.0.0',
        },
      },
      null,
      2
    );
  }
  if (layer === 'tsconfig.json') {
    return JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          outDir: './dist',
          rootDir: './src',
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'tests'],
      },
      null,
      2
    );
  }
  if (layer === 'jest.config.ts') {
    return `import type { Config } from 'jest';\n\nconst config: Config = {\n  preset: 'ts-jest',\n  testEnvironment: 'node',\n  roots: ['<rootDir>/tests'],\n};\n\nexport default config;\n`;
  }
  if (layer === 'nodemon.json') {
    return JSON.stringify({ watch: ['src'], ext: 'ts', exec: 'ts-node src/main.ts' }, null, 2);
  }
  if (layer === 'Dockerfile') {
    return `# ${service} — multi-stage Dockerfile\n# TODO: finalize build stages\nFROM node:20-alpine AS base\nWORKDIR /app\n`;
  }
  if (layer === '.dockerignore') {
    return 'node_modules\ndist\n.git\n*.md\n.env*\n';
  }
  if (layer === 'README.md') {
    return `# ${service}\n\nRoad Guard microservice. Port (dev): **${config.port}**.\n\nSee [ARCHITECTURE.md](../../ARCHITECTURE.md).\n`;
  }
  if (layer === 'docs/openapi.yaml') {
    return `openapi: 3.1.0\ninfo:\n  title: ${service}\n  version: 0.0.1\npaths: {}\n`;
  }
  if (layer === 'docs/asyncapi.yaml') {
    return `asyncapi: 2.6.0\ninfo:\n  title: ${service} Events\n  version: 0.0.1\nchannels: {}\n`;
  }
  if (layer === 'docs/erd.md') {
    return `# ${service} — ERD\n\n> TODO: document collections and relationships.\n`;
  }
  if (layer === 'docs/runbook.md') {
    return `# ${service} — Runbook\n\n> TODO: on-call procedures.\n`;
  }
  if (layer === 'docs/README.md') {
    return `# ${service} docs\n`;
  }
  return '';
}

function scaffoldPackage(name) {
  const base = `packages/${name}`;
  const dirs = [
    'src/index.ts',
    'src/.gitkeep',
    'tests/unit/.gitkeep',
    'tests/integration/.gitkeep',
    'package.json',
    'tsconfig.json',
    'README.md',
  ];
  if (name === 'contracts') {
    dirs.push('openapi/.gitkeep', 'grpc/.gitkeep', 'generated/.gitkeep');
  }
  if (name === 'events') {
    dirs.push('schemas/.gitkeep', 'envelope/.gitkeep', 'sourcing/.gitkeep');
  }
  if (name === 'ai-core') {
    dirs.push('prompts/.gitkeep', 'vector/.gitkeep', 'chains/.gitkeep', 'agents/.gitkeep');
  }
  if (name === 'config') {
    dirs.push('src/env.ts', 'src/feature-flags.ts');
  }
  for (const d of dirs) {
    if (d.endsWith('.gitkeep')) {
      touchGitkeep(`${base}/${d.replace('/.gitkeep', '')}`);
    } else if (d === 'package.json') {
      writeFile(
        `${base}/package.json`,
        JSON.stringify(
          {
            name: `@roadguard/${name}`,
            version: '0.0.1',
            private: true,
            main: 'dist/index.js',
            types: 'dist/index.d.ts',
            scripts: { build: 'tsc', test: 'jest', lint: 'eslint src --ext .ts' },
            devDependencies: { typescript: '^5.4.0' },
          },
          null,
          2
        )
      );
    } else if (d === 'tsconfig.json') {
      writeFile(
        `${base}/tsconfig.json`,
        JSON.stringify(
          { extends: '../../tsconfig.base.json', compilerOptions: { outDir: './dist', rootDir: './src' }, include: ['src/**/*'] },
          null,
          2
        )
      );
    } else if (d.endsWith('.ts')) {
      writeFile(`${base}/${d}`, `/**\n * @roadguard/${name}\n */\n\nexport {};\n`);
    } else if (d === 'README.md') {
      writeFile(`${base}/README.md`, `# @roadguard/${name}\n\nShared package.\n`);
    }
  }
}

function scaffoldInfra() {
  const dirs = [
    'infrastructure/docker/docker-compose.dev.yml',
    'infrastructure/docker/.env.example',
    'infrastructure/kubernetes/base/.gitkeep',
    'infrastructure/kubernetes/overlays/dev/kustomization.yaml',
    'infrastructure/kubernetes/overlays/staging/kustomization.yaml',
    'infrastructure/kubernetes/overlays/production/kustomization.yaml',
    'infrastructure/kubernetes/helm/roadguard-umbrella/Chart.yaml',
    'infrastructure/kubernetes/helm/charts/.gitkeep',
    'infrastructure/kubernetes/ingress/.gitkeep',
    'infrastructure/kubernetes/policies/.gitkeep',
    'infrastructure/kubernetes/secrets/.gitkeep',
    'infrastructure/terraform/modules/vpc/main.tf',
    'infrastructure/terraform/modules/eks/main.tf',
    'infrastructure/terraform/modules/mongodb-atlas/main.tf',
    'infrastructure/terraform/modules/msk-kafka/main.tf',
    'infrastructure/terraform/modules/elasticache-redis/main.tf',
    'infrastructure/terraform/modules/s3-cloudfront/main.tf',
    'infrastructure/terraform/modules/iam/main.tf',
    'infrastructure/terraform/modules/observability/main.tf',
    'infrastructure/terraform/environments/dev/main.tf',
    'infrastructure/terraform/environments/staging/main.tf',
    'infrastructure/terraform/environments/prod/main.tf',
    'infrastructure/terraform/backends/README.md',
    'infrastructure/nginx/nginx.conf',
    'infrastructure/pm2/ecosystem.config.cjs',
    'infrastructure/scripts/bootstrap.sh',
    'infrastructure/scripts/seed.sh',
    'infrastructure/scripts/migrate.sh',
    'deployments/argocd/app-of-apps.yaml',
    'deployments/flagger/canary.yaml',
    'deployments/helmfile.yaml',
    'ci/github-actions/workflows/ci.yml',
    'ci/github-actions/workflows/cd-dev.yml',
    'ci/github-actions/workflows/cd-staging.yml',
    'ci/github-actions/workflows/cd-prod.yml',
    'ci/github-actions/workflows/security-scan.yml',
    'ci/github-actions/workflows/contract-tests.yml',
    'ci/github-actions/workflows/infra-plan.yml',
    'ci/github-actions/reusable/build.yml',
    'ci/pipelines/README.md',
    'observability/otel-collector/config.yaml',
    'observability/prometheus/rules/alerts.yml',
    'observability/prometheus/scrape-configs/default.yml',
    'observability/grafana/dashboards/.gitkeep',
    'observability/grafana/datasources/datasources.yml',
    'observability/loki/config.yml',
    'observability/tempo/config.yml',
    'observability/alertmanager/config.yml',
    'docs/architecture/README.md',
    'docs/api/README.md',
    'docs/events/README.md',
    'docs/runbooks/README.md',
    'docs/onboarding/GETTING_STARTED.md',
    'docs/adr/ADR-0001-modular-monolith.md',
    'tools/codegen/README.md',
    'tools/scripts/README.md',
    'tools/generators/README.md',
    'tests/e2e/.gitkeep',
    'tests/load/.gitkeep',
    'tests/contract/.gitkeep',
    'tests/chaos/.gitkeep',
    '.github/CODEOWNERS',
    '.github/pull_request_template.md',
    '.github/ISSUE_TEMPLATE/bug_report.md',
    '.github/ISSUE_TEMPLATE/feature_request.md',
    '.husky/pre-commit',
    '.husky/pre-push',
  ];
  for (const app of Object.keys(APPS)) {
    dirs.push(`infrastructure/docker/${app}.Dockerfile`);
  }
  for (const d of dirs) {
    if (d.endsWith('.gitkeep')) touchGitkeep(d.replace('/.gitkeep', ''));
    else if (!fs.existsSync(path.join(ROOT, d))) {
      const content = d.endsWith('.sh')
        ? '#!/usr/bin/env bash\nset -euo pipefail\n# TODO\n'
        : d.endsWith('.md')
          ? `# ${path.basename(d, '.md')}\n\nTODO\n`
          : d.endsWith('.yaml') || d.endsWith('.yml')
            ? `# TODO: ${d}\n`
            : d.endsWith('.tf')
              ? `# TODO: Terraform module\n`
              : d.endsWith('.conf') || d.endsWith('.cjs')
                ? `// TODO: ${d}\n`
                : '';
      if (content) writeFile(d, content);
    }
  }
}

// Run
console.log('Scaffolding Road Guard monorepo at', ROOT);
for (const [name, config] of Object.entries(APPS)) {
  scaffoldService(name, config);
  console.log('  ✓', name);
}
for (const pkg of PACKAGES) {
  scaffoldPackage(pkg);
  console.log('  ✓ package', pkg);
}
scaffoldInfra();
console.log('Done.');
