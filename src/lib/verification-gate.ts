// 検証ゲートの判定。副作用を持たない純粋関数だけを置く。
// PR 本文の取得・更新は scripts/check-verification-gate.ts と scripts/reset-verification.ts で行う。

export interface ChangedArticle {
  readonly id: string;
  /** head の版で下書きか（削除された記事は false として扱う） */
  readonly headDraft: boolean;
}

export interface GateInput {
  readonly changedArticles: readonly ChangedArticle[];
  readonly body: string;
  /** PR 本文を最後に編集したユーザーのログイン名。一度も編集されていなければ null */
  readonly editorLogin: string | null;
  readonly codeOwner: string;
}

export interface GateResult {
  /** この PR に検証ゲートが必要か */
  readonly required: boolean;
  readonly passed: boolean;
  readonly reason: string;
}

const SECTION = /<!-- verification:start -->([\s\S]*?)<!-- verification:end -->/;
const CHECKED = /^\s*- \[[xX]\] 実機で検証した\s*$/m;
const CHECKED_GLOBAL = /^(\s*- \[)[xX](\] 実機で検証した\s*)$/gm;

const verificationSection = (body: string): string | undefined => SECTION.exec(body)?.[1];

export const evaluateGate = (input: GateInput): GateResult => {
  const { changedArticles, body, editorLogin, codeOwner } = input;

  if (changedArticles.every((a) => a.headDraft)) {
    return {
      required: false,
      passed: true,
      reason: '公開する記事の変更がないため対象外',
    };
  }

  const section = verificationSection(body);
  if (section === undefined) {
    return {
      required: true,
      passed: false,
      reason: 'PR 本文に検証の節（verification:start〜end）がない',
    };
  }
  if (!CHECKED.test(section)) {
    return {
      required: true,
      passed: false,
      reason: '「実機で検証した」に印が付いていない',
    };
  }
  if (editorLogin !== codeOwner) {
    return {
      required: true,
      passed: false,
      reason: `印を付けたのがコードオーナー（${codeOwner}）ではない（最終編集者: ${editorLogin ?? 'なし'}）`,
    };
  }
  return { required: true, passed: true, reason: 'コードオーナーが実機での検証を確認済み' };
};

/** 検証の節の中の印だけを外す（push があったときに使う）。ほかのチェックボックスは変えない。 */
export const uncheckVerification = (body: string): string =>
  body.replace(SECTION, (section) => section.replace(CHECKED_GLOBAL, '$1 $2'));

/** CODEOWNERS から、全体（`*`）に割り当てられたユーザーのログイン名を読む */
export const parseCodeOwners = (codeowners: string): readonly string[] =>
  codeowners
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('* '))
    .flatMap((line) => line.split(/\s+/).slice(1))
    .filter((owner) => owner.startsWith('@'))
    .map((owner) => owner.slice(1));
