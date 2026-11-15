// /llms.txt（エージェント向けの入口。llmstxt.org の形）を作る（T054）。純粋関数。

export interface LlmsSection {
  readonly name: string;
  readonly links: readonly {
    readonly title: string;
    readonly url: string;
    readonly note: string;
  }[];
}

export const buildLlmsTxt = (input: {
  readonly name: string;
  readonly description: string;
  readonly sections: readonly LlmsSection[];
}): string =>
  [
    `# ${input.name}`,
    '',
    `> ${input.description}`,
    '',
    ...input.sections
      .filter((s) => s.links.length > 0)
      .flatMap((s) => [
        `## ${s.name}`,
        '',
        ...s.links.map((l) => `- [${l.title}](${l.url}): ${l.note}`),
        '',
      ]),
  ].join('\n');
