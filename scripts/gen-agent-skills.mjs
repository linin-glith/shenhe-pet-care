#!/usr/bin/env node
/**
 * The agent-readable site directory.
 *
 * WHY THIS EXISTS
 * Three competitor factories publish a machine-readable index of what their
 * site can do for an AI agent. We do not — and the four skills this builds
 * are the part of the site that no competitor has anyway: the catalogue, the
 * development process, the compliance file set, and how to write to us.
 *
 * WHAT IT PUBLISHES
 *   /.well-known/agent-skills/index.json   the discovery index (the Agent
 *                                         Skills discovery format, 0.2.0)
 *   /.well-known/agent-skills/<name>/SKILL.md   the skills themselves
 *   /.well-known/openapi.json              the public API
 *   /.well-known/api-catalog               the linkset that points at both
 *   /.well-known/version.json              what is published and when
 *
 * WHERE THE SKILLS COME FROM
 * agent-skills/<name>/SKILL.md in the repository. They are written by hand,
 * because a skill is prose and prose is not generated; the index, the
 * digests and the links are generated from them, so the index cannot point
 * at a skill that is not there or quote a hash that does not match.
 *
 * WHY IT WRITES TO public/ AND out/
 * The script runs after `next build`, and Next copies public/ into out/
 * before the post-build scripts run. A file written only into public/ is
 * therefore one step behind the folder that gets published. So both are
 * written here, and the file is in the export either way.
 *
 * WHY THE API CATALOG IS A LINKSET
 * The linkset is the format that lets a machine find the machine-readable
 * description of a site: an anchor (the site), a service description (the
 * OpenAPI document), a service document (the human-readable brief) and a
 * status document (what version is published).
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'agent-skills');
const SITE = 'https://shenhezhongke.com';
const OUT = join(ROOT, 'out');

/** The discovery schema the index is written against. */
const DISCOVERY_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

/** Where each published file goes, relative to the site root. */
const PUBLISHED = [
  'agent-skills/index.json',
  'openapi.json',
  'api-catalog',
  'version.json',
];

/**
 * The skills, in the order an assistant should read them.
 *
 * The order is the buyer's order: what can I buy, how does the project run,
 * what paperwork can I have, and how do I write. The order in the index is
 * the order a reader will follow, so it is stated here rather than left to
 * the file system.
 */
const SKILL_ORDER = [
  'shenhe-sourcing',
  'shenhe-private-label-process',
  'shenhe-compliance-docs',
  'shenhe-rfq-helper',
];

/** The frontmatter of a SKILL.md, read without a YAML dependency. */
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

function writeBoth(name, body) {
  const targets = [join(ROOT, 'public', '.well-known', name)];
  if (existsSync(OUT)) targets.push(join(OUT, '.well-known', name));
  for (const dir of new Set(targets.map((t) => dirname(t)))) {
    mkdirSync(dir, { recursive: true });
  }
  for (const t of targets) {
    writeFileSync(t, body, 'utf8');
  }
}

/** The skills, read out of agent-skills/, with their digests. */
function readSkills() {
  if (!existsSync(SOURCE)) return [];
  const found = readdirSync(SOURCE, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const ordered = [
    ...SKILL_ORDER.filter((n) => found.includes(n)),
    ...found.filter((n) => !SKILL_ORDER.includes(n)).sort(),
  ];

  const skills = [];
  for (const name of ordered) {
    const file = join(SOURCE, name, 'SKILL.md');
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, 'utf8');
    const meta = frontmatter(raw);
    if (!meta.name || !meta.description) {
      console.error('  the skill has no frontmatter name/description: ' + name);
      process.exit(1);
    }
    if (meta.name !== name) {
      console.error(`  the frontmatter name does not match the folder: ${name} / ${meta.name}`);
      process.exit(1);
    }
    skills.push({
      name,
      type: 'skill-md',
      description: meta.description,
      url: `/.well-known/agent-skills/${name}/SKILL.md`,
      digest: 'sha256:' + createHash('sha256').update(raw).digest('hex'),
    });
  }
  return skills;
}

/**
 * The public API.
 *
 * ONLY the public endpoints are here. The console, the admin screens and the
 * buyer portal are authenticated surfaces, and publishing their route table
 * to the internet is a mistake — not a feature. The public three are the ones
 * a buyer or an agent has a use for.
 */
function openapi() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'SHENHE ZHONGKE — pet care OEM/ODM, public API',
      version: '1.0.0',
      description:
        'The public endpoints of shenhezhongke.com. Everything else on this site ' +
        '(the console, the admin screens and the buyer portal) is authenticated and ' +
        'is deliberately not described here.',
      license: { name: 'All rights reserved', url: SITE + '/terms.html' },
    },
    servers: [{ url: SITE }],
    paths: {
      '/api/health': {
        get: {
          summary: 'The service is up and the database answers',
          operationId: 'health',
          responses: {
            200: {
              description: 'The service is up',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      db: { type: 'string', enum: ['up', 'down'] },
                      time: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            503: { description: 'The database did not answer' },
          },
        },
      },
      '/api/inquiries': {
        post: {
          summary: 'Send an enquiry',
          description:
            'One of email or phone/whatsapp is required, and message is required. ' +
            'Two bot checks run on the server: a `company_website` field that a human ' +
            'never sees must be empty, and `form_age_ms` must be at least 2000. Both are ' +
            'refused with the same 422 as a missing field.\n\n' +
            'THE THREE THAT MAKE AN ENQUIRY QUOTABLE are products, volume and country - ' +
            'an enquiry that carries all three can be quoted without a follow-up question. ' +
            'The product ids come from /product-feed.json, which is the catalogue as a ' +
            'machine-readable feed.',
          operationId: 'createInquiry',
          parameters: [
            {
              name: 'Idempotency-Key',
              in: 'header',
              required: false,
              schema: { type: 'string', maxLength: 120 },
              description: 'Send the same key when you retry, and the retry does not become a second enquiry.',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string', maxLength: 4000 },
                    email: { type: 'string', maxLength: 200 },
                    phone: { type: 'string', maxLength: 60 },
                    whatsapp: { type: 'string', maxLength: 60 },
                    name: { type: 'string', maxLength: 120 },
                    company: { type: 'string', maxLength: 160 },
                    country: { type: 'string', maxLength: 80 },
                    products: {
                      type: 'array', maxItems: 50, items: { type: 'string' },
                      description:
                        'The SKU ids from /product-feed.json, or the product names. ' +
                        'One of the three that make an enquiry quotable.',
                    },
                    volume: {
                      type: 'string', maxLength: 60,
                      description:
                        'The annual volume, e.g. "100,000 - 500,000 units". ' +
                        'One of the three that make an enquiry quotable.',
                    },
                    quantity: { type: 'integer', description: 'The quantity being ordered.' },
                    incoterm: {
                      type: 'string',
                      enum: ['EXW Shenzhen (default)', 'FOB Guangzhou / Shenzhen', 'CIF', 'DDP'],
                    },
                    customerType: {
                      type: 'string',
                      enum: [
                        'A first private-label order',
                        'A repeat order for a product we already make',
                        'A distributor or wholesaler',
                        'A brand with its own formulation to match',
                        'A grooming salon or veterinary clinic buying for use',
                        'A buyer with an existing specification to match',
                      ],
                    },
                    source: { type: 'string', maxLength: 40 },
                    source_detail: { type: 'object', description: 'Where the enquiry came from.' },
                    idempotency_key: {
                      type: 'string', maxLength: 120,
                      description:
                        'Optional. Send the same key when you retry, and the retry does not ' +
                        'become a second enquiry. It can also be sent as the Idempotency-Key header.',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'The enquiry was recorded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      reference: { type: 'string', example: 'INQ-20261104-K3QW7' },
                      created_at: { type: 'string', format: 'date-time' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            400: { description: 'The body could not be read' },
            422: { description: 'A field was missing, or the submission tripped a bot check' },
            429: { description: 'Too many enquiries from this address' },
          },
        },
      },
      '/api/inquiries/track': {
        get: {
          summary: 'Where an enquiry got to',
          description:
            'Deliberately narrow: a reference shows that an enquiry exists and what ' +
            'state it is in, never who sent it or what it was about.',
          operationId: 'trackInquiry',
          parameters: [
            {
              name: 'reference',
              in: 'query',
              required: true,
              schema: { type: 'string', pattern: '^INQ-\\d{8}-[A-Z0-9]{5}$' },
            },
          ],
          responses: {
            200: {
              description: 'The enquiry',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      reference: { type: 'string' },
                      status: { type: 'string' },
                      created_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
            400: { description: 'That does not look like an enquiry reference' },
            404: { description: 'No enquiry with that reference' },
          },
        },
      },
    },
  };
}

/**
 * The linkset.
 *
 * The anchor is the site, and the service description is the OpenAPI
 * document; the service document is the reading brief an assistant reads
 * first, and the status document says what is published and when.
 */
function apiCatalog() {
  const desc = [{ href: `${SITE}/.well-known/openapi.json`, type: 'application/json' }];
  const doc = [{ href: `${SITE}/llms.txt`, type: 'text/plain' }];
  const status = [{ href: `${SITE}/.well-known/version.json`, type: 'application/json' }];
  return {
    linkset: [
      { anchor: `${SITE}/`, 'service-desc': desc, 'service-doc': doc, status },
      { anchor: `${SITE}/api/inquiries`, 'service-desc': desc, 'service-doc': doc, status },
    ],
  };
}

/** What is published, and when it was published. */
function version(skills) {
  return {
    site: SITE,
    legalName: 'Guangdong Shenhe Zhongke Biotechnology Co., Ltd.',
    brand: 'SHENHE ZHONGKE',
    languages: ['en'],
    published: new Date().toISOString().slice(0, 10),
    generator: 'scripts/gen-agent-skills.mjs',
    agentSkills: skills.map((s) => s.name),
    endpoints: ['/api/health', '/api/inquiries', '/api/inquiries/track'],
    readingLists: ['/llms.txt', '/llms-full.txt', '/llms-full.json', '/faq.json',
                   '/product-feed.json'],
  };
}

function main() {
  const skills = readSkills();
  if (!skills.length) {
    console.error('  no skills found in agent-skills/');
    process.exit(1);
  }

  // The skill files themselves.
  for (const s of skills) {
    const from = join(SOURCE, s.name, 'SKILL.md');
    const to = join(ROOT, 'public', '.well-known', 'agent-skills', s.name, 'SKILL.md');
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    if (existsSync(OUT)) {
      const outTo = join(OUT, '.well-known', 'agent-skills', s.name, 'SKILL.md');
      mkdirSync(dirname(outTo), { recursive: true });
      copyFileSync(from, outTo);
    }
  }

  // The discovery index.
  writeBoth(
    'agent-skills/index.json',
    JSON.stringify(
      {
        $schema: DISCOVERY_SCHEMA,
        skills,
      },
      null,
      2,
    ) + '\n',
  );

  // The API description, the linkset and the version document.
  writeBoth('openapi.json', JSON.stringify(openapi(), null, 2) + '\n');
  writeBoth('api-catalog', JSON.stringify(apiCatalog(), null, 2) + '\n');
  writeBoth('version.json', JSON.stringify(version(skills), null, 2) + '\n');

  console.log('  the agent-skills index: %d skill(s)', skills.length);
  for (const f of PUBLISHED) console.log('  published /.well-known/' + f);
  return 0;
}

process.exit(main());
