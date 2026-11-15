---
name: semantictime
description: 検証した日と版で読む、AI の使い方（各社の AI を同じ扱いで載せる非公式情報サイト）
colors:
  frame: '#0B1B33'
  frame-line: '#22385C'
  frame-control: '#3A527A'
  frame-text-muted: '#B4BFCF'
  ink: '#12161D'
  ink-muted: '#4D5562'
  rule: '#D9DDE3'
  rule-faint: '#EEF0F3'
  surface: '#FFFFFF'
  surface-sunken: '#F1F3F5'
  link: '#1D4ED8'
  link-hover: '#1E3A8A'
  selection: '#DBE4FF'
  status-ok: '#15803D'
  status-review: '#B45309'
  status-review-row: '#FFF8E6'
  status-stale: '#B91C1C'
  note-label: '#92400E'
  code-text: '#E7ECF4'
  line-claude-code: '#C2410C'
  line-claude-api: '#9D174D'
  line-mcp: '#854D0E'
  line-claude-app: '#BE123C'
  line-claude-chrome: '#7C2D12'
  line-chatgpt: '#3F3F46'
  line-codex: '#1E293B'
  line-sora: '#52525B'
  line-gemini: '#0369A1'
  line-gemini-cli: '#047857'
  line-midjourney: '#6D28D9'
  line-flux: '#7E22CE'
typography:
  page-title:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif"
    fontSize: '40px'
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: '0em'
  home-title:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif"
    fontSize: '48px'
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: '0em'
  section:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif"
    fontSize: '28px'
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: '0em'
  subsection:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif"
    fontSize: '20px'
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: '0em'
  body:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif"
    fontSize: '18px'
    fontWeight: 400
    lineHeight: 1.85
    letterSpacing: '0em'
  list-title:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif"
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: '0em'
  ui:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif"
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: '0em'
  label:
    fontFamily: "'BIZ UDPGothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif"
    fontSize: '12px'
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: '0em'
  data:
    fontFamily: "'BIZ UDGothic', ui-monospace, monospace"
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: '0em'
  code:
    fontFamily: "'BIZ UDGothic', ui-monospace, monospace"
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: '0em'
rounded:
  none: '0px'
  code-chip: '2px'
  control: '4px'
  station: '50%'
spacing:
  xs: '8px'
  sm: '16px'
  md: '24px'
  lg: '40px'
  xl: '64px'
  page-max: '1248px'
  article-max: '684px'
  rail: '240px'
components:
  product-code:
    backgroundColor: '{colors.line-claude-code}'
    textColor: '{colors.surface}'
    typography: '{typography.data}'
    rounded: '{rounded.code-chip}'
    height: '20px'
    padding: '0 4px'
  station:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.station}'
    size: '16px'
  code-block:
    backgroundColor: '{colors.frame}'
    textColor: '{colors.code-text}'
    typography: '{typography.code}'
    rounded: '{rounded.control}'
    padding: '16px'
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.surface}'
    typography: '{typography.ui}'
    rounded: '{rounded.control}'
    height: '40px'
    padding: '0 16px'
  search-field:
    backgroundColor: '{colors.frame}'
    textColor: '{colors.surface}'
    typography: '{typography.ui}'
    rounded: '{rounded.control}'
    height: '40px'
    padding: '0 12px 0 36px'
  nav-link-current:
    textColor: '{colors.ink}'
    typography: '{typography.ui}'
---

# semantictime のデザイン

デザインの確認用のキャンバス（Design Artifact）は `design-handoff/canvas/` に、路線図とアイコンは `design-handoff/assets/` にある。実装は `src/styles/tokens.css` の CSS custom properties に写し、色や余白をコードに直接書かない。

## Overview

**世界観：路線図と運行記録。** AI の会社を鉄道会社、製品を路線、記事を駅として並べる。このサイトの強み（記事ごとに手元で検証した日と版を載せ、公式の変更を毎朝たどる）を、「公式の変更 → 影響の判定 → 対応」という運行記録の形で見せる。

- **主役は運行記録。** ホームの最上部と、記事の題の直下に置く。進捗バーや得点のような飾りにしない。
- **Read モード。** 個性は枠（ヘッダー、路線図、運行記録、コードの組み方）で出し、本文の段は静かに組む。
- **全社を同じ扱いにする。** 骨組み（ホームの欄の幅、ナビの並び）は全社同じにし、会社を特別扱いしない。どの会社がどれだけ載るかは、記事の本数と更新から決まる。
- **番号は固定の ID、読む順は変わる。** `CC07` は記事を作ったときに一度だけ付け、全ページで同じ記事を指す。読む順は入れ替わることがあるので、画面に「何番目」とは書かない。入れ替えた日は製品のページに出す。

## Colors

- **枠は紺（`frame`）、読む面は白（`surface`）。** 紺はヘッダー、フッター、コードの面にだけ使う。
- **本文は墨（`ink`）、補足は `ink-muted`。** 補足でも白地とのコントラストは 4.5:1 以上。
- **リンクは `link` の1色。** 選択範囲とフォーカスの枠も、この系統から決める。
- **状態の色は文字で使う。** `status-review`（見直し中）と `status-stale`（期限切れ・破壊的な変更）は、文字の色と、見直し中の表の行（`status-review-row`）にだけ使う。淡い色付きの囲みにはしない。「期限内」「GA」は強調しない。
- **路線（製品）の色は、会社ごとに色の系統をそろえる。** Anthropic は暖色、OpenAI は無彩色、Google は青緑、画像・動画・音声の各社は紫。系統の中で明るさを変えて製品を分ける。どの色も白い文字とのコントラストは 4.5:1 以上（いまの値は 5.18〜14.63）。路線の色は、製品の記号、路線の線、ページ上端の帯にだけ使い、面を塗らない。

## Typography

- **書体は2つだけ。** 文章と見出しは BIZ UDPGothic、日付・記事番号・版・コードは等幅の BIZ UDGothic（どちらも Google Fonts）。等幅を「技術っぽさ」の飾りに使わない。
- **文字の大きさは役割で固定する。** 題 40（ホームは 48）、節 28、小見出し 20、本文 18、一覧の題 16、操作 14、日付 13、補助 12。ページごとに細かく変えない。
- **和文の字間は 0。** 英語のように詰めない。
- **見出しは `text-wrap: balance` と `word-break: auto-phrase`、段落は `text-wrap: pretty`。** 固定の改行（`<br>`）は使わない。
- **空白のない長い文字列（ツール名、URL）は `overflow-wrap: anywhere` で折り返す。** 記事の題、運行記録の文、出典に必ず付ける。
- 本文の段の幅は最大 684px（およそ 38 字）。

## Layout

- **余白は 8・16・24・40・64 の5段だけ。** 大きな区切りは 64、区切りの中は 24、見出しと一覧の間は 16。
- ページの最大幅は 1248px、左右の余白は `clamp(16px, 4vw, 48px)`。
- 記事は本文（最大 684px）と右の欄（240px、目次と「このページを使う」）。狭い画面では1列にし、右の欄は本文の後ろに回す。
- ナビは狭い画面でも1行のまま、横にスクロールさせる（項目は縮ませない）。
- 区切りは罫線で示す。上端の太い罫（`ink` 1px）で節を始め、行は細い罫（`rule`）で区切る。

## Elevation & Depth

影は使わない。奥行きは、紺の枠と白い面の対比、罫線、余白だけで出す。

## Shapes

- 角は、データの面 0、操作部品 4px、製品の記号 2px、駅だけ円。
- 路線の線は 4px、駅は直径 16px で輪郭 3px。駅の中に状態を詰め込まず、状態は日付の横に文字で書く。
- 乗り換え駅は、白地に墨の輪郭の角丸の印（路線図のイラストと同じ形）。

## Components

- **運行記録：** 縦の線でつないだ3段（公式の変更 → 影響の判定 → 対応）。各段は、日付と段の名前（`label`）、本文（15px）。変更がないときは「今週はまだ公式の変更がありません。毎朝 6 時に確かめています。」と書く。
- **検証と追跡の記録：** 記事の題の直下。定義リストで「手元で検証」「公式の変更の確認」「次の見直し」を並べ、影響があるときだけ「見直し中」の行を加える。
- **会社と製品（ホーム）：** 全社を同じ幅の列で並べる（会社の順はナビと同じで固定）。列の見出しは会社名と記事の本数。その下に製品ごとの路線を置き、読む順の先頭から 2 本と「すべて見る（N 本）」。記事が 0 本の会社は「まだ公開した記事がありません。」と書き、列は消さない。
- **路線（記事の一覧）：** 路線の記号と製品名、その下に駅を縦に並べる。駅の題（16px）の下に、記事番号・日付（13px 等幅）・難易度、必要なときだけ「見直し中」「期限切れ」。記事が0本の路線は出さない。製品名と会社名が違うとき（画像・動画・音声の各社）だけ、製品名の下に会社名を 12px で添える。
- **製品の記号：** 2文字の記号（`CC`）。記事番号と並べるときは「CC 07」の形にする。ナビには付けない。
- **注意書き：** 囲みや色付きの左線を使わない。欄外に「注意」の見出しを置き、上下を細い罫で挟む。
- **コード：** 紺の面に、上段にファイル名と「コピー」。
- **空の状態：** 見出しだけを残さず、何がないのかを一文で書く。
- **ヘッダーとフッターの部品は、読み込んだ側のページに影響する全体の指定を持たない。** 色はそれぞれの要素に直接書く。

### 動き

- 見せ場はひとつだけ。ホームの路線図の線が、会社の並び順に 70ms ずつずれて描かれ、最後に駅が現れる（全体で約 1 秒、`cubic-bezier(0.16, 1, 0.3, 1)`）。線の長さは実測した値を使う。
- 反応：ボタンは押した瞬間に `scale(0.97)`、「すべて見る」の矢印はマウスを当てたときだけ 3px 右へ、開閉の矢印は 200ms で回る。マウスを当てたときの反応は `@media (hover: hover)` の中に書く。
- `prefers-reduced-motion: reduce` では、線を描く動きをやめて完成した路線図を見せる。

## Do's and Don'ts

- **Do** 状態は言葉で書く（「見直し中」「期限切れ」）。色は言葉を補うだけにする。
- **Do** 件数や「対応が必要な製品」は、データから計算して出す。画面に固定の数字を書かない。
- **Do** 長い題、空白のない識別子、記事が0本の路線、空の一覧を、実装のたびに確かめる（break-ui の「最悪」のデータ）。
- **Don't** 見出しの上の小さなラベル（eyebrow）を置かない。
- **Don't** 角丸のカードを並べて骨組みにしない。淡い色付きの囲み、グラデーション、影を使わない。
- **Don't** 製品の色で面を塗らない。同じ保証（「出典を確認済み」など）を項目ごとに繰り返さない。
- **Don't** 記号の文字や絵文字をアイコンの代わりにしない。アイコンは `design-handoff/assets/icons.svg-snippets.html` の線の太さ 1.6 の1セットだけを使う。
- **Don't** 実在の鉄道会社の駅名標、配色一式、記号の形を借りない。
