// 実名と雇用先のアカウント名が、公開するファイルに含まれていないかを調べる（T061）。純粋関数。
// パターンはリポジトリに置かない（CI では secret、手元ではリポジトリの外のファイル）。
// 結果にはファイルの名前だけを返し、パターンそのものはログに出さない。

export const parsePatterns = (text: string): readonly string[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));

export const findForbidden = (
  files: readonly { readonly path: string; readonly text: string }[],
  patterns: readonly string[],
): readonly string[] => {
  if (patterns.length === 0) throw new Error('検索パターンが空（REAL_NAME_PATTERNS を設定する）');
  const lowered = patterns.map((p) => p.toLowerCase());
  return files
    .filter(({ text }) => {
      const body = text.toLowerCase();
      return lowered.some((p) => body.includes(p));
    })
    .map(({ path }) => path);
};
