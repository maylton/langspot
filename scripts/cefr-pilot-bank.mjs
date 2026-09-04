#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const PILOT_VERSION = 'pilot-0.2';
export const PILOT_STATUS = 'approved_for_pilot';
export const PSYCHOMETRIC_STATUS = 'uncalibrated';

const EXPECTED = {
  total: 300,
  objective: 234,
  productive: 66,
  tasklets: 36,
  answerKeys: { A: 59, B: 58, C: 59, D: 58 },
  bySkill: { reading: 72, listening: 72, language_use: 90, writing: 18, spoken_production: 18, spoken_interaction: 18, mediation: 12 },
};

const RUBRICS = {
  writing: ['Task Achievement', 'Range', 'Accuracy', 'Organisation & Cohesion', 'Register & Pragmatic Appropriacy'],
  spoken_production: ['Range', 'Grammatical Accuracy', 'Lexical Control', 'Fluency', 'Coherence', 'Pronunciation / Phonological Control'],
  spoken_interaction: ['Range', 'Grammatical Accuracy', 'Lexical Control', 'Fluency', 'Interaction', 'Coherence', 'Pronunciation / Phonological Control'],
  mediation: ['Information Selection', 'Accuracy of Meaning', 'Reformulation', 'Organisation', 'Audience Appropriacy', 'Language Control'],
};

const rubricFor = (skill) => (RUBRICS[skill] ?? []).map((label) => ({
  key: label.toLowerCase().replace(/ & /g, '_').replace(/ \/ /g, '_').replace(/ /g, '_'),
  label,
  maxScore: 11,
  scale: 'cefr',
}));

const sectionBetween = (markdown, start, end) => {
  const from = markdown.indexOf(start);
  const to = markdown.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`Section not found: ${start}`);
  return markdown.slice(from + start.length, to);
};

const answerKeys = (markdown) => new Map(
  [...markdown.matchAll(/^\| `([A-Z]+-[A-Z0-9]+-[0-9]+(?:-Q[0-9]+)?)` \| \*\*([A-D])\*\* \| ([^|]+) \| ([1-5])\/5 \|$/gm)]
    .map((match) => [match[1], { key: match[2], subskill: match[3].trim(), difficulty: Number(match[4]) }]),
);

const levelSegments = (content) => {
  const matches = [...content.matchAll(/^## (A1|A2|B1|B2|C1|C2)(?: —.*)?$/gm)];
  return matches.map((match, index) => ({
    level: match[1],
    body: content.slice(match.index + match[0].length, matches[index + 1]?.index ?? content.length),
  }));
};

const metadataValue = (body, key) => body.match(new RegExp(`^\\*\\*${key}:\\*\\* (.+)$`, 'm'))?.[1]?.trim() ?? null;
const parseRange = (value) => {
  if (!value) return null;
  const numbers = [...value.matchAll(/\d+/g)].map((match) => Number(match[0]));
  const unit = value.includes('word') ? 'words' : value.includes('minute') ? 'minutes' : 'seconds';
  return numbers.length >= 2 ? { min: numbers[0], max: numbers[1], unit, label: value } : null;
};

const parseDurationRange = (value) => {
  if (!value) return null;
  const clock = value.match(/(\d+):(\d+)/);
  if (clock) {
    const seconds = Number(clock[1]) * 60 + Number(clock[2]);
    return { min: seconds, max: seconds, label: value };
  }
  const minuteSecond = value.match(/(\d+)\s*min(?:ute)?s?\s*(\d+)?\s*sec/i);
  if (minuteSecond) {
    const seconds = Number(minuteSecond[1]) * 60 + Number(minuteSecond[2] ?? 0);
    return { min: seconds, max: seconds, label: value };
  }
  const seconds = [...value.matchAll(/\d+/g)].map((match) => Number(match[0]));
  if (/seconds?/i.test(value) && seconds.length) return { min: seconds[0], max: seconds.at(-1), label: value };
  throw new Error(`Unsupported duration: ${value}`);
};

const wordCount = (value) => value.trim().split(/\s+/).filter(Boolean).length;

const parseOptions = (body) => {
  const options = [...body.matchAll(/^- \*\*([A-D])\.\*\* (.+)$/gm)].map((match) => ({ key: match[1], text: match[2].trim() }));
  if (options.length !== 4) throw new Error(`Expected four options, found ${options.length}`);
  return options;
};

const parseObjectiveItems = (body, keys, defaults) => {
  const matches = [...body.matchAll(/^\d+\. \*\*([A-Z]+-[A-Z0-9]+-[0-9]+(?:-Q[0-9]+)?) — ([a-z_]+) \(difficulty ([1-5])\/5\)\*\*$/gm)];
  return matches.map((match, index) => {
    const itemBody = body.slice(match.index + match[0].length, matches[index + 1]?.index ?? body.length).split(/^### Answer key & metadata$/m)[0].split(/^#### Answer key & metadata$/m)[0];
    const firstOption = itemBody.search(/^- \*\*[A-D]\.\*\*/m);
    if (firstOption < 0) throw new Error(`Options not found for ${match[1]}`);
    const prompt = itemBody.slice(0, firstOption).trim();
    const optionsWithKeys = parseOptions(itemBody);
    const keyMetadata = keys.get(match[1]);
    if (!keyMetadata) throw new Error(`Answer key not found for ${match[1]}`);
    if (keyMetadata.subskill !== match[2] || keyMetadata.difficulty !== Number(match[3])) throw new Error(`Metadata mismatch for ${match[1]}`);
    const answer = optionsWithKeys.find((option) => option.key === keyMetadata.key)?.text;
    if (!answer) throw new Error(`Answer is not an option for ${match[1]}`);
    return {
      externalId: match[1],
      ...defaults,
      subskill: match[2],
      difficulty: Number(match[3]),
      taskType: 'multiple_choice',
      questionType: defaults.skill === 'listening' ? 'listening' : 'multiple_choice',
      prompt,
      options: optionsWithKeys.map((option) => option.text),
      answer,
      answerKey: keyMetadata.key,
      rubric: null,
      sourceMaterial: null,
      responseConstraints: null,
      primaryEvidence: null,
    };
  });
};

const parseTaskletBank = (markdown, start, end, skill) => {
  const content = sectionBetween(markdown, start, end);
  const keys = answerKeys(content);
  const tasklets = [];
  const items = [];
  for (const { level, body } of levelSegments(content)) {
    const taskletMatches = [...body.matchAll(new RegExp(`^### ((${skill === 'reading' ? 'R' : 'L'})-${level}-[0-9]{3}) — (.+)$`, 'gm'))];
    for (let index = 0; index < taskletMatches.length; index += 1) {
      const match = taskletMatches[index];
      const taskletBody = body.slice(match.index + match[0].length, taskletMatches[index + 1]?.index ?? body.length);
      const inputHeadings = skill === 'reading' ? ['#### Input'] : ['#### Internal audio script', '#### Script'];
      const inputHeading = inputHeadings.find((heading) => taskletBody.includes(heading));
      const inputStart = inputHeading ? taskletBody.indexOf(inputHeading) : -1;
      const itemsStart = taskletBody.indexOf('#### Items', inputStart);
      if (!inputHeading || inputStart < 0 || itemsStart < 0) throw new Error(`Input/items not found for ${match[1]}`);
      const inputText = taskletBody.slice(inputStart + inputHeading.length, itemsStart).trim();
      const durationLabel = metadataValue(taskletBody, 'Estimated duration');
      const duration = parseDurationRange(durationLabel);
      const tasklet = {
        externalId: match[1], level, skill, title: match[3].trim(),
        topic: metadataValue(taskletBody, 'Topic'), genre: metadataValue(taskletBody, 'Genre'),
        audience: metadataValue(taskletBody, 'Audience'),
        inputKind: skill === 'reading' ? 'text' : 'audio_script', inputText,
        inputLength: Number(metadataValue(taskletBody, skill === 'reading' ? 'Input length' : 'Script length')?.match(/\d+/)?.[0]) || wordCount(inputText),
        estimatedDurationSeconds: duration?.max ?? null,
        estimatedDurationMinSeconds: duration?.min ?? null,
        estimatedDurationMaxSeconds: duration?.max ?? null,
        estimatedDurationLabel: duration?.label ?? null,
      };
      tasklets.push(tasklet);
      items.push(...parseObjectiveItems(taskletBody.slice(itemsStart + '#### Items'.length), keys, {
        level, skill, category: skill === 'reading' ? 'Reading' : 'Listening', topic: tasklet.topic,
        genre: tasklet.genre, audience: tasklet.audience, taskletExternalId: tasklet.externalId,
      }).map((item, itemIndex) => ({ ...item, taskletPosition: itemIndex + 1 })));
    }
  }
  return { tasklets, items };
};

const parseLanguageUseSection = (markdown, start, end) => {
  const content = sectionBetween(markdown, start, end);
  const keys = answerKeys(content);
  return levelSegments(content).flatMap(({ level, body }) => parseObjectiveItems(body, keys, {
    level, skill: 'language_use', category: 'Language Use', topic: null, genre: null,
    audience: 'general', taskletExternalId: null, taskletPosition: null,
  }));
};

const parseLanguageUse = (markdown) => [
  ...parseLanguageUseSection(markdown, '# 6. Language Use Bank', '# 7. Writing Task Bank'),
  ...parseLanguageUseSection(markdown, '# 23. Additional Language Use items', '# 24. Additional Writing prompts'),
];

const productiveConfig = [
  ['# 7. Writing Task Bank', '# 8. Spoken Production Task Bank', 'writing', 'Writing', 'Target'],
  ['# 8. Spoken Production Task Bank', '# 9. Spoken Interaction Task Bank', 'spoken_production', 'Speaking', 'Target duration'],
  ['# 9. Spoken Interaction Task Bank', '# 10. Mediation Task Bank', 'spoken_interaction', 'Speaking', 'Suggested duration'],
  ['# 10. Mediation Task Bank', '# 11. Revisão vertical A1 → C2', 'mediation', 'Mediation', 'Target'],
];

const splitMediationPrompt = (content) => {
  const boundary = content.search(/^(Your English-speaking|Explain the change|Explain to the club organiser|Explain this finding|Brief a manager|Prepare a concise briefing)/m);
  return boundary > 0
    ? { sourceMaterial: content.slice(0, boundary).trim(), prompt: content.slice(boundary).trim() }
    : { sourceMaterial: content, prompt: content };
};

const parseProductive = (markdown) => productiveConfig.flatMap(([start, end, skill, category, targetKey]) => {
  const content = sectionBetween(markdown, start, end);
  return levelSegments(content).flatMap(({ level, body }) => {
    const matches = [...body.matchAll(/^### ((?:W|SP|SI|M)-(?:A1|A2|B1|B2|C1|C2)-[0-9]{3}) — ([a-z0-9_]+)$/gm)];
    return matches.map((match, index) => {
      const itemBody = body.slice(match.index + match[0].length, matches[index + 1]?.index ?? body.length).split(/^---$/m)[0];
      const metadataEnd = [...itemBody.matchAll(/^\*\*(?:Topic|Audience|Target|Target duration|Suggested duration|Primary evidence):\*\* .+$/gm)].at(-1);
      if (!metadataEnd) throw new Error(`Metadata not found for ${match[1]}`);
      const content = itemBody.slice(metadataEnd.index + metadataEnd[0].length).trim();
      const mediation = skill === 'mediation' ? splitMediationPrompt(content) : null;
      const prompt = mediation?.prompt ?? content;
      const constraints = parseRange(metadataValue(itemBody, targetKey));
      return {
        externalId: match[1], level, skill, category, subskill: match[2], difficulty: null,
        taskType: match[2], questionType: skill === 'writing' ? 'writing' : skill === 'mediation' ? 'mediation' : 'speaking',
        topic: metadataValue(itemBody, 'Topic'), genre: match[2], audience: metadataValue(itemBody, 'Audience'),
        taskletExternalId: null, taskletPosition: null, prompt, options: [], answer: null, answerKey: null,
        rubric: rubricFor(skill), sourceMaterial: mediation?.sourceMaterial ?? null,
        responseConstraints: constraints, primaryEvidence: metadataValue(itemBody, 'Primary evidence'),
      };
    });
  });
});

const expansionProductiveConfig = [
  ['# 24. Additional Writing prompts', '# 25. Additional Spoken Production prompts', 'writing', 'Writing', 'Target length', 'Prompt'],
  ['# 25. Additional Spoken Production prompts', '# 26. Additional Spoken Interaction tasks', 'spoken_production', 'Speaking', 'Target speaking time', 'Prompt'],
  ['# 26. Additional Spoken Interaction tasks', '# 27. Additional Mediation tasks', 'spoken_interaction', 'Speaking', null, 'Task'],
  ['# 27. Additional Mediation tasks', '# 28. QA validation of expansion v0.2', 'mediation', 'Mediation', null, 'Task'],
];

const parseExpansionProductive = (markdown) => expansionProductiveConfig.flatMap(([start, end, skill, category, targetKey, promptKey]) => {
  const content = sectionBetween(markdown, start, end);
  return levelSegments(content).flatMap(({ level, body }) => {
    const matches = [...body.matchAll(/^### ((?:W|SP|SI|M)-(?:A1|A2|B1|B2|C1|C2)-[0-9]{3}) — ([a-z0-9_]+)$/gm)];
    return matches.map((match, index) => {
      const itemBody = body.slice(match.index + match[0].length, matches[index + 1]?.index ?? body.length).split(/^---$/m)[0].trim();
      const prompt = metadataValue(itemBody, promptKey);
      if (!prompt) throw new Error(`Prompt not found for ${match[1]}`);
      const sourceMaterial = skill === 'mediation' ? itemBody.slice(0, itemBody.search(/^\*\*Task:\*\*/m)).trim() : null;
      return {
        externalId: match[1], level, skill, category, subskill: match[2], difficulty: null,
        taskType: match[2], questionType: skill === 'writing' ? 'writing' : skill === 'mediation' ? 'mediation' : 'speaking',
        topic: null, genre: match[2], audience: 'general', taskletExternalId: null, taskletPosition: null,
        prompt, options: [], answer: null, answerKey: null, rubric: rubricFor(skill), sourceMaterial,
        responseConstraints: targetKey ? parseRange(metadataValue(itemBody, targetKey)) : null, primaryEvidence: null,
      };
    });
  });
});

export function parsePilotBank(markdown) {
  const reading = parseTaskletBank(markdown, '# 4. Reading Bank', '# 5. Listening Bank', 'reading');
  const listening = parseTaskletBank(markdown, '# 5. Listening Bank', '# 6. Language Use Bank', 'listening');
  const additionalReading = parseTaskletBank(markdown, '# 21. Additional Reading tasklets', '# 22. Additional Listening tasklets', 'reading');
  const additionalListening = parseTaskletBank(markdown, '# 22. Additional Listening tasklets', '# 23. Additional Language Use items', 'listening');
  const items = [...reading.items, ...additionalReading.items, ...listening.items, ...additionalListening.items, ...parseLanguageUse(markdown), ...parseProductive(markdown), ...parseExpansionProductive(markdown)]
    .map((item) => ({ ...item, bankVersion: PILOT_VERSION, qualityStatus: PILOT_STATUS, psychometricStatus: PSYCHOMETRIC_STATUS }));
  const tasklets = [...reading.tasklets, ...additionalReading.tasklets, ...listening.tasklets, ...additionalListening.tasklets]
    .map((tasklet) => ({ ...tasklet, bankVersion: PILOT_VERSION, qualityStatus: PILOT_STATUS, psychometricStatus: PSYCHOMETRIC_STATUS }));
  return { version: PILOT_VERSION, status: PILOT_STATUS, psychometricStatus: PSYCHOMETRIC_STATUS, tasklets, items };
}

export function validatePilotBank(bank) {
  const errors = [];
  const ids = [...bank.tasklets.map((item) => item.externalId), ...bank.items.map((item) => item.externalId)];
  if (new Set(ids).size !== ids.length) errors.push('IDs are not unique.');
  if (bank.items.length !== EXPECTED.total) errors.push(`Expected ${EXPECTED.total} units, found ${bank.items.length}.`);
  if (bank.tasklets.length !== EXPECTED.tasklets) errors.push(`Expected ${EXPECTED.tasklets} tasklets, found ${bank.tasklets.length}.`);
  const objective = bank.items.filter((item) => ['reading', 'listening', 'language_use'].includes(item.skill));
  const productive = bank.items.filter((item) => !['reading', 'listening', 'language_use'].includes(item.skill));
  if (objective.length !== EXPECTED.objective) errors.push(`Expected ${EXPECTED.objective} objective items, found ${objective.length}.`);
  if (productive.length !== EXPECTED.productive) errors.push(`Expected ${EXPECTED.productive} productive tasks, found ${productive.length}.`);
  for (const item of objective) {
    if (item.options.length !== 4 || new Set(item.options).size !== 4) errors.push(`${item.externalId}: options must contain four distinct values.`);
    if (!item.answer || item.options.filter((option) => option === item.answer).length !== 1) errors.push(`${item.externalId}: invalid answer.`);
    if (!/^[A-D]$/.test(item.answerKey ?? '')) errors.push(`${item.externalId}: invalid answer key.`);
  }
  for (const key of ['A', 'B', 'C', 'D']) {
    const count = objective.filter((item) => item.answerKey === key).length;
    if (count !== EXPECTED.answerKeys[key]) errors.push(`Answer key ${key}: expected ${EXPECTED.answerKeys[key]}, found ${count}.`);
  }
  const contentSignatures = bank.items.map((item) => JSON.stringify([
    item.skill, item.taskletExternalId, item.prompt.trim().replace(/\s+/g, ' ').toLowerCase(), item.options,
  ]));
  if (new Set(contentSignatures).size !== contentSignatures.length) errors.push('Exact item content is duplicated.');
  for (const item of productive) {
    if (item.answer !== null || item.answerKey !== null || item.options.length) errors.push(`${item.externalId}: productive task must not have an objective answer.`);
    if (!item.rubric?.length) errors.push(`${item.externalId}: productive task requires a rubric.`);
    if (item.skill === 'spoken_production' && item.rubric.some((criterion) => criterion.key === 'interaction')) errors.push(`${item.externalId}: Spoken Production must not score Interaction.`);
    if (item.skill === 'mediation' && !item.sourceMaterial) errors.push(`${item.externalId}: Mediation requires source material.`);
  }
  for (const item of bank.items) {
    if (!CEFR_LEVELS.includes(item.level)) errors.push(`${item.externalId}: invalid CEFR level.`);
    if (!Object.hasOwn(EXPECTED.bySkill, item.skill)) errors.push(`${item.externalId}: invalid skill.`);
    if (!item.subskill) errors.push(`${item.externalId}: missing subskill.`);
    if (item.taskletExternalId && !bank.tasklets.some((tasklet) => tasklet.externalId === item.taskletExternalId && tasklet.skill === item.skill && tasklet.level === item.level)) errors.push(`${item.externalId}: invalid tasklet association.`);
    if (['reading', 'listening'].includes(item.skill) !== Boolean(item.taskletExternalId)) errors.push(`${item.externalId}: tasklet relationship mismatch.`);
  }
  for (const [skill, expected] of Object.entries(EXPECTED.bySkill)) {
    const count = bank.items.filter((item) => item.skill === skill).length;
    if (count !== expected) errors.push(`${skill}: expected ${expected}, found ${count}.`);
    for (const level of CEFR_LEVELS) {
      const expectedByLevel = expected / CEFR_LEVELS.length;
      const levelCount = bank.items.filter((item) => item.skill === skill && item.level === level).length;
      if (levelCount !== expectedByLevel) errors.push(`${skill}/${level}: expected ${expectedByLevel}, found ${levelCount}.`);
    }
  }
  for (const skill of ['reading', 'listening']) for (const level of CEFR_LEVELS) {
    const count = bank.tasklets.filter((tasklet) => tasklet.skill === skill && tasklet.level === level).length;
    if (count !== 3) errors.push(`${skill}/${level}: expected 3 tasklets, found ${count}.`);
  }
  for (const tasklet of bank.tasklets.filter((item) => item.skill === 'listening')) {
    if (!tasklet.estimatedDurationMinSeconds || !tasklet.estimatedDurationMaxSeconds || tasklet.estimatedDurationMinSeconds > tasklet.estimatedDurationMaxSeconds) errors.push(`${tasklet.externalId}: invalid listening duration range.`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const promptGroups = new Map();
  for (const item of bank.items) {
    const prompt = item.prompt.trim().replace(/\s+/g, ' ').toLowerCase();
    promptGroups.set(prompt, [...(promptGroups.get(prompt) ?? []), item.externalId]);
  }
  return {
    total: bank.items.length, objective: objective.length, productive: productive.length, tasklets: bank.tasklets.length,
    repeatedPromptGroups: [...promptGroups.values()].filter((ids) => ids.length > 1),
    bySkillAndLevel: Object.fromEntries(Object.keys(EXPECTED.bySkill).map((skill) => [skill, Object.fromEntries(CEFR_LEVELS.map((level) => [level, bank.items.filter((item) => item.skill === skill && item.level === level).length]))])),
  };
}

const sqlLiteral = (value) => value === null || value === undefined ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
const jsonLiteral = (value) => value === null || value === undefined ? 'null' : `${sqlLiteral(JSON.stringify(value))}::jsonb`;

export function buildSeedSql(bank) {
  return `-- Generated from docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.2.md. Do not edit pedagogical content here.\n` +
`begin;\nselect private.import_cefr_pilot_bank(\n  ${jsonLiteral(bank.tasklets)},\n  ${jsonLiteral(bank.items)}\n);\nselect private.validate_cefr_pilot_bank('${PILOT_VERSION}');\ncommit;\n`;
}

async function main() {
  const args = process.argv.slice(2);
  const source = resolve(args.find((arg) => !arg.startsWith('--')) ?? 'docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.2.md');
  const outputArg = args.find((arg) => arg.startsWith('--output='));
  const markdown = await readFile(source, 'utf8');
  const bank = parsePilotBank(markdown);
  const summary = validatePilotBank(bank);
  if (outputArg) {
    const output = resolve(outputArg.slice('--output='.length));
    await writeFile(output, buildSeedSql(bank));
    console.log(`Generated ${output}`);
  }
  console.log(JSON.stringify(summary, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
