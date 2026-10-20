#!/usr/bin/env node
// Generates docs/TOOLS.md and the tool summary of README.md from tools.json.
//
//   node scripts/generate-tools-md.mjs           rewrite both files
//   node scripts/generate-tools-md.mjs --check   exit 1 if either one is out of date
//
// It also sets the "$comment" of tools.json to the text below, so a freshly
// generated tools.json can be copied in as is before running the script.
//
// No dependencies: Node.js 18 or later is enough.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TOOLS_JSON = join(ROOT, 'tools.json')
const TOOLS_MD = join(ROOT, 'docs', 'TOOLS.md')
const README = join(ROOT, 'README.md')

const CATEGORY_ORDER = [
	'campaigns',
	'lists',
	'enrichment',
	'linkedin_scraper',
	'mailboxes',
	'account',
	'inbox',
	'inbox_settings',
]
// Categories that the server lists only once the Inbox was opened in the Emelia app.
const INBOX_CATEGORIES = ['inbox', 'inbox_settings']
// The "delete" effect covers every tool flagged destructiveHint: deletions, and in
// the inbox sending, forwarding or moving emails to Trash or Spam.
const EFFECTS = { read: 'Read', write: 'Write', delete: 'Destructive', credits: 'Credits' }
const BLOCK_START = '<!-- generated:tools-summary:start -->'
const BLOCK_END = '<!-- generated:tools-summary:end -->'
const COUNT_PATTERN = /\*\*\d+ tools?\*\* in \*\*\d+ categor(?:y|ies)\*\*/g

const COMMENT =
	'Generated from the tool definitions of the Emelia MCP server. Do not edit by hand.'

const check = process.argv.includes('--check')
const toolsJson = readFileSync(TOOLS_JSON, 'utf8')
const data = JSON.parse(toolsJson)

/** tools.json with its "$comment" set to COMMENT, formatting untouched. */
function withPublicComment(text) {
	const value = JSON.stringify(COMMENT)
	const pattern = /("\$comment"\s*:\s*)"(?:[^"\\]|\\.)*"/
	if (pattern.test(text)) return text.replace(pattern, (_, key) => `${key}${value}`)
	return text.replace(/^\{\r?\n/, (start) => `${start}\t"$comment": ${value},\n`)
}

/** Text that fits in one Markdown table cell. */
function cell(text) {
	return String(text ?? '')
		.replace(/\|/g, '\\|')
		.replace(/\s*\n\s*/g, ' ')
		.trim()
}

// Only names with an underscore, so that ordinary words are left alone.
const TOOL_NAME = new RegExp(
	`(?<![\\w\`])(${data.tools
		.map((tool) => tool.name)
		.filter((name) => name.includes('_'))
		.sort((a, b) => b.length - a.length)
		.join('|')})(?![\\w\`])`,
	'g'
)

/** Table cell text, with the tool names it mentions formatted as code. */
function prose(text) {
	return inline(cell(text))
}

/** Markdown text, "<" escaped and tool names formatted as code outside code spans. */
function inline(text) {
	return text
		.split(/(`[^`]*`)/)
		.map((part, index) => (index % 2 ? part : part.replace(/</g, '&lt;').replace(TOOL_NAME, '`$1`')))
		.join('')
}

/** A tool description as Markdown, with its line breaks, lists and bold headings kept. */
function block(text) {
	return String(text ?? '')
		.split(/\r?\n/)
		.map((line) => inline(line.trimEnd()))
		.join('\n')
		.trim()
}

function plural(count, word, many = `${word}s`) {
	return `${count} ${count === 1 ? word : many}`
}

function rank(id) {
	const index = CATEGORY_ORDER.indexOf(id)
	return index === -1 ? CATEGORY_ORDER.length : index
}

function fail(message) {
	console.error(`tools.json: ${message}`)
	process.exit(1)
}

// Categories in display order, each with its tools in the order of tools.json.
const categories = [...data.toolsets]
	.sort((a, b) => rank(a.id) - rank(b.id))
	.map((category) => ({
		...category,
		list: data.tools.filter((tool) => tool.toolset === category.id),
	}))

for (const tool of data.tools) {
	if (!categories.some((category) => category.id === tool.toolset)) {
		fail(`tool ${tool.name} belongs to an unknown category "${tool.toolset}".`)
	}
	if (!EFFECTS[tool.effect]) {
		fail(`tool ${tool.name} has an unknown effect "${tool.effect}".`)
	}
	if (tool.effect === 'credits' && !tool.credits) {
		fail(`tool ${tool.name} spends credits but does not say how many.`)
	}
}
for (const category of categories) {
	const listed = category.list.map((tool) => tool.name).join(',')
	if (listed !== category.tools.join(',')) {
		fail(`the tools of category "${category.id}" do not match its tool list.`)
	}
}

const total = data.tools.length
const categoryWord = (count) => plural(count, 'category', 'categories')
const inboxTools = data.tools.filter((tool) => INBOX_CATEGORIES.includes(tool.toolset))
const inboxNames = INBOX_CATEGORIES.map((id) => `\`${id}\``).join(' and ')

function countBy(tools, effect) {
	return tools.filter((tool) => tool.effect === effect).length
}

function anchor(title) {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9 _-]/g, '')
		.replace(/ /g, '-')
}

function annotationList(tool) {
	const names = Object.entries(tool.annotations ?? {})
		.filter(([, value]) => value === true)
		.map(([name]) => `\`${name}\``)
	return names.length ? names.join(', ') : 'none'
}

function effectSummary(tools) {
	return Object.entries(EFFECTS)
		.map(([effect, label]) => `${countBy(tools, effect)} ${label}`)
		.join(', ')
}

function parameterType(parameter) {
	if (parameter.enum) return parameter.enum.map((value) => `\`${value}\``).join(', ')
	let type = parameter.type
	const { minItems, maxItems } = parameter
	if (minItems !== undefined && maxItems !== undefined) type += `, ${minItems} to ${maxItems} items`
	else if (minItems !== undefined) type += `, at least ${plural(minItems, 'item')}`
	else if (maxItems !== undefined) type += `, ${maxItems} items at most`
	return type
}

function buildToolsMd() {
	const lines = [
		'<!-- Generated by scripts/generate-tools-md.mjs from tools.json. Do not edit by hand. -->',
		'',
		'# Tools',
		'',
		`Version ${data.server.version} of the Emelia MCP server exposes **${plural(total, 'tool')}** in **${categoryWord(categories.length)}**. This page is generated from [\`tools.json\`](../tools.json), the machine-readable list of the tools as the server declares them. Without the \`toolsets\` parameter the server lists every category; with \`?toolsets=\` it lists only the categories you name (see [Tool categories](../README.md#tool-categories)). The ${plural(inboxTools.length, 'tool')} of the ${inboxNames} categories appear only once the Inbox was opened in the Emelia app; until then the server lists the other ${total - inboxTools.length}. The server has no prompts or resources.`,
		'',
		'Back to the [README](../README.md).',
		'',
		`| Category | Tools | ${Object.values(EFFECTS).join(' | ')} |`,
		'| --- | ---: | ---: | ---: | ---: | ---: |',
		...categories.map(
			(category) =>
				`| [${category.title}](#${anchor(category.title)}) (\`${category.id}\`) | ${category.list.length} | ${countBy(category.list, 'read')} | ${countBy(category.list, 'write')} | ${countBy(category.list, 'delete')} | ${countBy(category.list, 'credits')} |`
		),
		`| **Total** | **${total}** | **${countBy(data.tools, 'read')}** | **${countBy(data.tools, 'write')}** | **${countBy(data.tools, 'delete')}** | **${countBy(data.tools, 'credits')}** |`,
		'',
		'## How to read the tables',
		'',
		'- **Read**: the tool reads your Emelia account or your inbox and changes nothing (`readOnlyHint`).',
		'- **Write**: the tool creates or changes data in your Emelia account or your inbox. `start_campaign` and `send_campaign_test_email` are Write tools that send real messages.',
		'- **Destructive**: the tool is flagged `destructiveHint`: it deletes data or, in the inbox, sends, forwards or moves emails to Trash or Spam. Most clients ask you before running it; keep that confirmation on.',
		'- **Credits**: the tool spends Emelia credits. The cost is in the Notes column; prices are on [docs.emelia.io](https://docs.emelia.io/docs/credits).',
		`- The other tools call the Emelia REST API with your sign-in or your API key and return its JSON response, without an output schema. The tools of the ${inboxNames} categories work on the Inbox of the same account and declare an output schema.`,
	]

	for (const category of categories) {
		lines.push(
			'',
			`## ${category.title}`,
			'',
			`Category \`${category.id}\`, ${plural(category.list.length, 'tool')}: ${prose(category.summary)}`,
			'',
			'| Tool | Description | Effect | Notes |',
			'| --- | --- | --- | --- |',
			...category.list.map(
				(tool) =>
					`| [\`${tool.name}\`](#${tool.name}) | ${cell(tool.title)} | ${EFFECTS[tool.effect]} | ${cell(tool.credits ?? '')} |`
			)
		)
		for (const tool of category.list) {
			lines.push(
				'',
				`### ${tool.name}`,
				'',
				`**${cell(tool.title)}**. Effect: ${EFFECTS[tool.effect]}. Annotations: ${annotationList(tool)}.`,
				'',
				block(tool.description)
			)
			if (tool.credits) lines.push('', `Cost: ${tool.credits}.`)
			lines.push('')
			if (tool.parameters.length) {
				lines.push(
					'| Parameter | Type | Required | Description |',
					'| --- | --- | --- | --- |',
					...tool.parameters.map(
						(parameter) =>
							`| \`${parameter.name}\` | ${cell(parameterType(parameter))} | ${parameter.required ? 'yes' : 'no'} | ${prose(parameter.description ?? '')} |`
					)
				)
			} else {
				lines.push('No parameters.')
			}
			for (const note of tool.notes ?? []) lines.push('', `> ${note}`)
		}
	}

	lines.push(
		'',
		'## Not covered yet',
		'',
		'Only the legacy campaigns, the email only or LinkedIn only campaigns of the previous Emelia campaign system, have no tools: use their [REST API routes](https://docs.emelia.io/docs/campaigns/legacy). To ask for a tool, [open a tool request](https://github.com/emelia-io/emelia-mcp/issues/new/choose).',
		''
	)
	return lines.join('\n')
}

function buildReadmeBlock() {
	return [
		BLOCK_START,
		'| Category | Tools | What it covers |',
		'| --- | ---: | --- |',
		...categories.map(
			(category) =>
				`| [${category.title}](docs/TOOLS.md#${anchor(category.title)}) | ${category.list.length} | ${prose(category.summary)} |`
		),
		`| **Total** | **${total}** | ${effectSummary(data.tools)} |`,
		'',
		...categories.flatMap((category) => [
			`**${category.title}**: ${category.list.map((tool) => `\`${tool.name}\``).join(', ')}`,
			'',
		]),
		BLOCK_END,
	].join('\n')
}

function updateReadme(readme) {
	const start = readme.indexOf(BLOCK_START)
	const end = readme.indexOf(BLOCK_END)
	if (start === -1 || end === -1 || end < start) {
		console.error(`README.md: missing the ${BLOCK_START} / ${BLOCK_END} markers.`)
		process.exit(1)
	}
	if (!readme.match(COUNT_PATTERN)) {
		console.error('README.md: missing the "**N tools** in **N categories**" sentence.')
		process.exit(1)
	}
	const updated =
		readme.slice(0, start) + buildReadmeBlock() + readme.slice(end + BLOCK_END.length)
	return updated.replace(
		COUNT_PATTERN,
		`**${plural(total, 'tool')}** in **${categoryWord(categories.length)}**`
	)
}

const toolsMd = buildToolsMd()
const readme = readFileSync(README, 'utf8')
const nextReadme = updateReadme(readme)
const nextToolsJson = withPublicComment(toolsJson)

if (check) {
	const problems = []
	const current = existsSync(TOOLS_MD) ? readFileSync(TOOLS_MD, 'utf8') : null
	if (current !== toolsMd) problems.push('docs/TOOLS.md is out of date.')
	if (nextReadme !== readme) problems.push('The tool summary in README.md is out of date.')
	if (nextToolsJson !== toolsJson) problems.push('The "$comment" of tools.json is not the expected one.')
	if (problems.length) {
		console.error(
			[...problems, 'Run "node scripts/generate-tools-md.mjs" and commit the result.'].join('\n')
		)
		process.exit(1)
	}
	console.log(`docs/TOOLS.md and README.md match tools.json (${plural(total, 'tool')}).`)
} else {
	writeFileSync(TOOLS_MD, toolsMd)
	writeFileSync(README, nextReadme)
	if (nextToolsJson !== toolsJson) writeFileSync(TOOLS_JSON, nextToolsJson)
	console.log(`Wrote docs/TOOLS.md and the README tool summary (${plural(total, 'tool')}).`)
}
