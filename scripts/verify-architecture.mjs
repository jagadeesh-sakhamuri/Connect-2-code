import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const scanRoots = ['src', 'index.html', 'vite.config.js', '.github'];
const bannedPatterns = [
  { label: 'Vercel reference', pattern: /vercel\.app|vercel\.com|Vercel/i },
  { label: 'client-side mock mode', pattern: /VITE_USE_MOCK/ },
  { label: 'randomized application data', pattern: /Math\.random\s*\(/ },
  { label: 'Vercel hostname fallback', pattern: /hostname\.includes\(['"]vercel\.app['"]\)/ },
];

const files = [];

function collect(path) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) return;

  if (statSync(absolute).isDirectory()) {
    for (const entry of readdirSync(absolute)) {
      collect(join(path, entry));
    }
    return;
  }

  files.push(path);
}

for (const rootPath of scanRoots) collect(rootPath);

const failures = [];

if (existsSync(join(root, '.env'))) {
  failures.push('Tracked/local .env file exists. Use .env.example for documented configuration.');
}

if (existsSync(join(root, 'vercel.json'))) {
  failures.push('Vercel configuration exists even though GitHub Actions is the deployment validation path.');
}

for (const file of files) {
  const content = readFileSync(join(root, file), 'utf8');

  for (const rule of bannedPatterns) {
    if (rule.pattern.test(content)) {
      failures.push(`${rule.label}: ${relative(root, file)}`);
    }
  }

  if (file.startsWith('src' + '/') && /(^|\n)\s*import\s+.*from\s+['"]axios['"]/.test(content) && file !== 'src/core/api/apiClient.ts') {
    failures.push(`direct axios import outside apiClient: ${file}`);
  }

  if (file.startsWith('src' + '/') && /\bfetch\s*\(/.test(content)) {
    failures.push(`direct fetch call outside the shared API layer: ${file}`);
  }
}

if (failures.length > 0) {
  console.error('Architecture verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Architecture verification passed for ${files.length} scanned files.`);
}
