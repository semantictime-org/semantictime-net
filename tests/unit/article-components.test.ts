import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import DisclosureBox from '../../src/components/disclosure/DisclosureBox.astro';
import StatusBanner from '../../src/components/status/StatusBanner.astro';
import VerificationBadge from '../../src/components/verification/VerificationBadge.astro';
import { disclosureOf, verificationRecordOf } from '../../src/lib/article-meta';

const container = await AstroContainer.create();
const NOW = new Date('2026-11-15T03:00:00+09:00');
const VERIFIED_AT = new Date('2026-11-01T00:00:00+09:00');

describe('VerificationBadge', () => {
  test('検証日・状態・版・次の見直し・履歴へのリンクを出す', async () => {
    const record = verificationRecordOf(
      { verification: 'hands-on', verifiedAt: VERIFIED_AT, type: 'how-to', categories: ['coding'] },
      NOW,
    );
    const html = await container.renderToString(VerificationBadge, {
      props: { record, versions: ['Claude Code 2.1.325', 'macOS'], historyHref: '#history' },
    });
    expect(html).toContain('2026.11.01');
    expect(html).toContain('検証済み');
    expect(html).toContain('Claude Code 2.1.325');
    expect(html).toContain('2026.12.31');
    expect(html).toContain('href="#history"');
  });

  test('出典で確かめた記事には見直し日を出さない', async () => {
    const record = verificationRecordOf(
      { verification: 'sources', verifiedAt: VERIFIED_AT, type: 'news', categories: [] },
      NOW,
    );
    const html = await container.renderToString(VerificationBadge, {
      props: { record, versions: [] },
    });
    expect(html).toContain('出典を確認');
    expect(html).not.toContain('次回の見直し');
  });
});

describe('StatusBanner（T077）', () => {
  test('状態と機能の名前を出す', async () => {
    const html = await container.renderToString(StatusBanner, {
      props: { status: 'removed', features: ['Remote Control'] },
    });
    expect(html).toContain('提供が終わった機能：Remote Control');
  });
});

describe('DisclosureBox（T079）', () => {
  test.each([
    ['draft-and-edit', '執筆支援：AI'],
    ['none', 'AI 不使用'],
  ] as const)(
    '%s では「%s」と、検証・編集者と検証日・バージョンを出す',
    async (aiAssisted, label) => {
      const disclosure = disclosureOf({
        aiAssisted,
        author: 'shizukukai',
        verifiedAt: VERIFIED_AT,
        versions: ['Claude Code 2.1.325'],
      });
      const html = await container.renderToString(DisclosureBox, { props: { disclosure } });
      expect(html).toContain(label);
      expect(html).toContain('検証・編集：shizukukai／検証日 2026-11-01・Claude Code 2.1.325');
    },
  );
});
