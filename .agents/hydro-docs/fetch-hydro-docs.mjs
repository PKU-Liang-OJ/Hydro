import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const repo = 'hydro-dev/hydro-dev.github.io';
const branch = 'docs';
const sourcePrefix = 'content/docs/Hydro/';
const outputRoot = path.resolve('.agents/hydro-docs');
const pagesRoot = path.join(outputRoot, 'pages');
const rawBase = `https://raw.githubusercontent.com/${repo}/${branch}/`;
const docsBase = 'https://hydro.js.org/zh/docs/Hydro';
const fetchedAt = new Date().toISOString();

async function getJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Hydro-agent-doc-sync' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
  return response.json();
}

async function getText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Hydro-agent-doc-sync' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
  return response.text();
}

async function getSourceText(sourcePath) {
  const sourceUrl = `${rawBase}${sourcePath}`;
  try {
    return await getText(sourceUrl);
  } catch (error) {
    const { stdout } = await execFileAsync('curl', ['-L', '--fail', '--max-time', '30', '-sS', sourceUrl], {
      maxBuffer: 20 * 1024 * 1024,
    });
    return stdout;
  }
}

async function walkFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

async function getSourceFilesFromArchive() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'hydro-docs-'));
  const archivePath = path.join(tempRoot, 'docs.tar.gz');
  await execFileAsync('curl', [
    '-L',
    '--fail',
    '--max-time',
    '90',
    '-sS',
    '-o',
    archivePath,
    `https://codeload.github.com/${repo}/tar.gz/refs/heads/${branch}`,
  ], { maxBuffer: 20 * 1024 * 1024 });
  await execFileAsync('tar', ['-xzf', archivePath, '-C', tempRoot], { maxBuffer: 20 * 1024 * 1024 });
  const [rootDirName] = (await fs.readdir(tempRoot)).filter((name) => name !== 'docs.tar.gz');
  const repoRoot = path.join(tempRoot, rootDirName);
  const docsRoot = path.join(repoRoot, sourcePrefix);
  const files = await walkFiles(docsRoot);
  return files
    .map((localPath) => {
      const relative = path.relative(repoRoot, localPath).split(path.sep).join('/');
      return { path: relative, localPath, type: 'blob' };
    })
    .filter((entry) => isChineseDoc(entry.path))
    .sort((a, b) => a.path.localeCompare(b.path));
}

async function getSourceFiles() {
  try {
    const tree = await getJson(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`);
    return tree.tree
      .filter((entry) => entry.type === 'blob' && isChineseDoc(entry.path))
      .sort((a, b) => a.path.localeCompare(b.path));
  } catch (error) {
    console.warn(`GitHub tree API failed, falling back to tarball: ${error.message}`);
    return getSourceFilesFromArchive();
  }
}

function isChineseDoc(pathname) {
  return pathname.startsWith(sourcePrefix)
    && /\.(md|mdx)$/.test(pathname)
    && !pathname.endsWith('.en.md')
    && !pathname.endsWith('.en.mdx');
}

function outputPathFor(sourcePath) {
  const relative = sourcePath.slice(sourcePrefix.length).replace(/\.mdx?$/, '.md');
  return path.join(pagesRoot, relative);
}

function docsUrlFor(sourcePath) {
  let relative = sourcePath.slice(sourcePrefix.length).replace(/\.mdx?$/, '');
  relative = relative.replace(/\/index$/, '').replace(/^index$/, '');
  return relative ? `${docsBase}/${relative}` : docsBase;
}

function rewriteRelativeMarkdownLinks(markdown, sourcePath) {
  const sourceDir = path.posix.dirname(sourcePath);
  return markdown.replace(/(!?\[[^\]]*]\()((?![a-z][a-z+.-]*:|#|\/)[^)]+)(\))/gi, (full, start, target, end) => {
    const [pathname, suffix = ''] = target.split(/(?=[?#])/);
    const normalized = path.posix.normalize(path.posix.join(sourceDir, pathname));
    if (start.startsWith('!')) return `${start}${rawBase}${normalized}${suffix}${end}`;
    return `${start}${target}${end}`;
  });
}

function normalizeMarkdown(markdown, sourcePath) {
  let result = markdown.replace(/^import .+$/gm, '').trim();
  result = result
    .replace(/<Callout\s+type="warn"\s*>/g, '\n> [!WARNING]\n')
    .replace(/<Callout[^>]*>/g, '\n> [!NOTE]\n')
    .replace(/<\/Callout>/g, '\n')
    .replace(/<Tabs[^>]*>/g, '\n')
    .replace(/<\/Tabs>/g, '\n')
    .replace(/<Tab[^>]*>/g, '\n')
    .replace(/<\/Tab>/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  result = rewriteRelativeMarkdownLinks(result, sourcePath);
  const sourceUrl = `${rawBase}${sourcePath}`;
  const docsUrl = docsUrlFor(sourcePath);
  return `<!--\nSource: ${sourceUrl}\nDocs URL: ${docsUrl}\nFetched: ${fetchedAt}\nAsset policy: image files are not mirrored; Markdown image links point to remote sources.\n-->\n\n${result}\n`;
}

function titleFromMarkdown(markdown, fallback) {
  const frontMatterTitle = markdown.match(/^---[\s\S]*?\ntitle:\s*(.+?)\n[\s\S]*?---/);
  if (frontMatterTitle) return frontMatterTitle[1].replace(/^['"]|['"]$/g, '').trim();
  const heading = markdown.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : fallback;
}

async function writeStaticFiles(docs) {
  const byRelative = new Map(docs.map((doc) => [doc.relative, doc]));
  const pageLink = (relative, label) => byRelative.has(relative)
    ? `[${label}](pages/${relative})`
    : label;

  const index = `# Hydro 文档索引\n\n`
    + `本目录是 Hydro 中文文档的本地 Markdown 快照，供 agent 快速检索使用。\n\n`
    + `- 文档源站: ${docsBase}\n`
    + `- 文档源仓库: https://github.com/${repo}/tree/${branch}/content/docs/Hydro\n`
    + `- 抓取时间: ${fetchedAt}\n`
    + `- 资源策略: 保存文本和远程图片链接，不镜像图片文件。\n\n`
    + `## 快速主题\n\n`
    + `- 介绍与能力对比: ${pageLink('index.md', '介绍')}\n`
    + `- 部署 Hydro: ${pageLink('install/index.md', '部署 Hydro')}\n`
    + `- 本仓库 Docker 部署: [Docker 本地摘要](docker-local.md)\n`
    + `- 存储 / S3: ${pageLink('install/s3.md', '存储')}\n`
    + `- 反向代理 / SSL: ${pageLink('install/proxy.md', '反向代理 / SSL 配置')}\n`
    + `- 编译器和语言: ${pageLink('install/compiler.md', '编译器和语言')}\n`
    + `- SMTP / 邮件: ${pageLink('install/smtp.md', 'SMTP')}\n`
    + `- RISC-V 安装: ${pageLink('install/riscv.md', '在 RISC-V 架构设备上安装')}\n`
    + `- 用户文档: ${pageLink('user/index.md', '用户文档')}\n`
    + `- 题目与测试数据: ${pageLink('user/testdata.md', '测试数据')}, ${pageLink('user/problem-create.md', '创建题目')}, ${pageLink('user/problem-format.md', '题目格式')}\n`
    + `- 域与权限: ${pageLink('user/domain.md', '域')} / ${pageLink('user/permission.md', '权限')}\n`
    + `- 系统管理与 CLI: ${pageLink('system/maintain.md', '系统维护')}, ${pageLink('system/cli.md', 'CLI')}\n`
    + `- 导入用户: ${pageLink('system/import-user.md', '导入用户')}\n`
    + `- CDN / 数据库: ${pageLink('system/cdn.md', 'CDN')}, ${pageLink('system/database.md', '数据库')}\n`
    + `- 插件: ${pageLink('plugins/index.md', '插件')}, ${pageLink('plugins/hydrojudge.md', 'HydroJudge')}, ${pageLink('plugins/vjudge.md', 'VJudge')}\n`
    + `- 升级与调试 FAQ: ${pageLink('FAQ/upgrade.md', '升级指南')}, ${pageLink('FAQ/debug.md', '调试')}\n`
    + `- 开发: ${pageLink('dev/index.md', '开发')}, ${pageLink('dev/db-layout.md', '数据库结构')}, ${pageLink('dev/frontend-modify.md', '前端修改')}\n`
    + `- Judge API: ${pageLink('api/judge.md', 'Judge API')}\n\n`
    + `## 全量页面\n\n`
    + docs.map((doc) => `- [${doc.title}](pages/${doc.relative}) - ${doc.docsUrl}`).join('\n')
    + `\n`;

  const dockerReadme = await fs.readFile('install/docker/README.md', 'utf8');
  const dockerLocal = `# 本仓库 Docker 部署摘要\n\n`
    + `Source: install/docker/README.md\n\n`
    + `## Agent 注意事项\n\n`
    + `- 当前项目 Docker 部署入口是 \`install/docker/docker-compose.yml\`。\n`
    + `- 修改或新增功能必须改源代码，先本地测试，再重新 build Docker 镜像并部署。\n`
    + `- 不要直接修改运行中的 Docker 容器来实现功能或修复问题。\n`
    + `- 不要提交 \`install/docker/data/**\` 或 \`install/docker/judge/judge.yaml\`。\n\n`
    + `## 原始 Docker README\n\n`
    + dockerReadme.trim()
    + `\n`;

  const sources = `# Sources\n\n`
    + `- Snapshot generated at: ${fetchedAt}\n`
    + `- Live docs root: ${docsBase}\n`
    + `- Source repository: https://github.com/${repo}/tree/${branch}/content/docs/Hydro\n`
    + `- Source branch: ${branch}\n`
    + `- Pages captured: ${docs.length}\n`
    + `- Asset policy: Markdown text is stored locally; images are not mirrored and point to remote raw GitHub URLs.\n\n`
    + `The refresh script first tries the GitHub tree API and falls back to the branch tarball if the API is unavailable or rate limited.\n\n`
    + `## Refresh\n\n`
    + `Run from the repository root:\n\n`
    + '```sh\nnode .agents/hydro-docs/fetch-hydro-docs.mjs\n```\n';

  await fs.writeFile(path.join(outputRoot, 'INDEX.md'), index, 'utf8');
  await fs.writeFile(path.join(outputRoot, 'docker-local.md'), dockerLocal, 'utf8');
  await fs.writeFile(path.join(outputRoot, 'SOURCES.md'), sources, 'utf8');
}

async function main() {
  await fs.mkdir(pagesRoot, { recursive: true });
  const sourceFiles = await getSourceFiles();

  const docs = [];
  for (const entry of sourceFiles) {
    const markdown = entry.localPath
      ? await fs.readFile(entry.localPath, 'utf8')
      : await getSourceText(entry.path);
    const outPath = outputPathFor(entry.path);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    const normalized = normalizeMarkdown(markdown, entry.path);
    await fs.writeFile(outPath, normalized, 'utf8');
    const relative = path.relative(pagesRoot, outPath).split(path.sep).join('/');
    docs.push({
      relative,
      title: titleFromMarkdown(markdown, relative),
      docsUrl: docsUrlFor(entry.path),
    });
    console.log(`wrote ${relative}`);
  }

  await writeStaticFiles(docs);
  console.log(`Wrote ${docs.length} Hydro docs to ${pagesRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
