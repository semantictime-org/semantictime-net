# semantictime.net

日本語圏で最も整理された、Claude の非公式情報サイト。Astro 7（静的出力）を Cloudflare Workers で配信する。

## 作業の流れ（必ず守る）

- 作業は `content/<slug>`（記事）か `fix/<topic>`（それ以外）のブランチで行い、push する。PR は GitHub Actions（open-pr.yml）が GitHub App の名前で作る。自分で PR を作らない。
- main へ直接 push しない。承認・マージ・PR 本文の編集・ワークフローファイルの変更は人が行う（Claude の資格情報ではできない設計になっている）。
- 記事の公開は1日1本まで（`site.config.ts` の `publishCapPerDay`）。実機で検証していない記事は公開しない。
- 各タスクの終わりに `npm run check`（lint → typecheck → test → build）を実行する。

## コード

- TypeScript は strict。`any`・`unknown`・`class` は使わない（ESLint で禁止）。
- 判定のロジック（公開上限、検証ゲート、上流の分類）はテストを先に書く。
- 色や余白をハードコードしない。デザイントークンは `src/styles/tokens.css` に置く。
- TypeScript は 6.0 系に固定している（typescript-eslint と @astrojs/check が 7 系に未対応のため）。

## 書いてはいけないもの

- 実名と雇用先の名前・アカウント名。著者はペンネーム shizukukai で表記する。pre-push フック（`.githooks/pre-push`）が、リポジトリの外のパターンファイルで検査する。
- 雇用先の社内情報や顧客事例。
- 上流（Anthropic のドキュメント）の文章の転載。記事は自分の言葉で書き、引用は出典つきで必要最小限にする。

## 初回のセットアップ（マシンごと）

```bash
mise install
npm ci
git config core.hooksPath .githooks
git config user.name shizukukai
git config user.email "<semantictime の noreply アドレス>"
```

`gh` は `mise.toml` の `GH_CONFIG_DIR` で、push 専用の PAT（semantictime）を使う。Claude Code の Bash では `.claude/settings.local.json` の `env` で同じ値を渡す。
