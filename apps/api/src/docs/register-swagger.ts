import path from 'node:path';
import { readFileSync } from 'node:fs';
import type { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

let cachedSpec: Record<string, unknown> | null = null;

function getSpecPath(): string {
  return path.join(__dirname, 'openapi.yaml');
}

function loadOpenApiSpec(): Record<string, unknown> {
  if (cachedSpec) return cachedSpec;

  cachedSpec = YAML.load(getSpecPath()) as Record<string, unknown>;
  return cachedSpec;
}

/**
 * Mounts Swagger UI at `/api-docs` with OpenAPI 3.0 spec and JWT bearer auth.
 */
export function registerSwaggerDocs(app: Application): void {
  const spec = loadOpenApiSpec();

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: 'Road Guard API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    }),
  );

  app.get('/api-docs/openapi.json', (_req, res) => {
    res.json(spec);
  });

  app.get('/api-docs/openapi.yaml', (_req, res) => {
    res.type('text/yaml').send(readFileSync(getSpecPath(), 'utf8'));
  });
}
