# semantictime.net

日本語圏で最も整理された、AI の使い方の非公式情報サイト（Claude・ChatGPT・Gemini などを同じ扱いで載せる）。Astro 7（静的出力）を Cloudflare Workers で配信する。

## 作業の流れ（必ず守る）

- 作業は `content/<slug>`（記事）か `fix/<topic>`（それ以外）のブランチで行い、push する。PR は GitHub Actions（open-pr.yml）が GitHub App の名前で作る。自分で PR を作らない。
- main へ直接 push しない。承認・マージ・PR 本文の編集・ワークフローファイルの変更は人が行う（Claude の資格情報ではできない設計になっている）。
- 記事の公開は1日1本を目標にする（上限は設けない）。実機で検証していない記事は公開しない。
- 各タスクの終わりに `npm run check`（lint → typecheck → test → build）を実行する。

### PR とマージ（auto-merge）

- push すると App が PR を作り、CI が通るとすぐ Squash でマージされる。1つの変更は1つのブランチにまとめ、push は1回にする。
- マージ済みのブランチへ追加で push しない（同じブランチ名で新しい PR が自動で作られる）。直すときは新しいブランチを作る。
- 試験用の PR は `fix/trial-…` にする（auto-merge の対象外）。
- 必須チェックは strict（main に追いついている必要がある）。PR が main より遅れたら `gh pr update-branch <番号>` で追いつかせる。
- 記事の公開には、人が PR 本文に検証の印（「実機で検証した」か「一次情報の出典を確かめた」）を付ける。push のたびに印は外れる。Claude は印を付けない。

### 確かめ方

- push の前に `npm run check` と `npm run test:e2e` の両方を通す（CI でも e2e を動かす）。
- 終了コードは `npm run check > .tmp/check.log 2>&1; echo "exit=$?"` のように確かめる。`| grep` や `| tail` につなぐと失敗を見落とす。
- Astro 7 の preview は AI エージェントの中だと常駐するので `--ignore-lock` を付ける。

### Claude が扱わないもの

- トークンや PAT の値、`REAL_NAME_PATTERNS` とパターンファイルの中身。作成と貼り付けは人が行う。
- `.github/` のワークフローの変更は、push 用の PAT ではできない。人のログインした Chrome で、GitHub の Web エディタから変える（Claude in Chrome を使ってよい）。
- Cloudflare の Worker の新規作成と独自ドメインの設定は、ダッシュボードで行う（`docs/runbook.md`）。

## コード

- TypeScript は strict。`any`・`unknown`・`class` は使わない（ESLint で禁止）。
- 判定のロジック（公開日、検証ゲート、上流の分類）はテストを先に書く。
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

パターンファイルは `~/.config/semantictime/real-name-patterns`（1行1パターン）に、マシンごとに人が置く。

### Windows で使うとき

- Git for Windows を入れ、Git Bash で上の手順を行う（pre-push のフックは bash で動く）。改行は `.gitattributes` で LF にそろえている。
- push 用の PAT はマシンごとに別に作る（片方をなくしても、その1本だけ取り消せばよい）。保存先は `%USERPROFILE%\.config\gh-semantictime`。
- `.claude/settings.local.json` は Windows で作り直し、`env.GH_CONFIG_DIR` に上の保存先を絶対パスで書く。
- e2e の前に `npx playwright install chromium` を実行する。
- `.tmp/` と Claude のメモリーはマシンの中にだけある。運用の決まりはこのファイルと `docs/` に書く。
