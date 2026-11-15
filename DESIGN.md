---
name: semantictime
description: その手順、いま動きますか。— 手元で動かした日と版をつけて公開し、公式の変更を毎朝たどる AI の使い方サイト（各社を同じ扱いで載せる非公式サイト）
colors:
  ink-band: '#0B0D12'
  ink: '#172343'
  ink-muted: '#59637A'
  on-band: '#FFFFFF'
  on-band-muted: '#C5CBD8'
  on-band-faint: '#9AA3B5'
  key: '#1A3CFF'
  key-hover: '#0F2BD6'
  key-on-band: '#8095FF'
  surface: '#FFFFFF'
  surface-soft: '#F4F6FB'
  surface-tint: '#EEF2FF'
  rule: '#DDE2EF'
  band-card: '#151922'
  band-rule: 'rgba(255,255,255,0.10)'
  watermark: 'rgba(255,255,255,0.04)'
  status-ok: '#15803D'
  status-ok-bg: '#ECF8F0'
  status-review: '#B45309'
  status-review-bg: '#FFF4E0'
  status-stale: '#9B3D17'
  status-stale-bg: '#F8E8E1'
  live: '#3DDC84'
typography:
  display:
    fontFamily: "'Anton', 'Impact', sans-serif"
    fontWeight: 400
    letterSpacing: '0.01em'
  headline:
    fontFamily: "'Zen Kaku Gothic New', sans-serif"
    fontWeight: 900
    letterSpacing: '-0.04em'
  body:
    fontFamily: "'BIZ UDPGothic', sans-serif"
    fontSize: '16px'
    lineHeight: 1.9
  data:
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace"
    fontSize: '13px'
rounded:
  control: '6px'
  card: '8px'
  ticket: '12px'
  pill: '999px'
spacing:
  page-max: '1184px'
  gutter-narrow: '20px'
  section: '64px'
  band-pad: '56px'
---

# semantictime のデザイン（v11）

確認用のキャンバスは `design-handoff/canvas/` にある。正本は `Fresh*.dc.html`（ホーム・記事・ヘッダー・フッター）と、同じ見た目に変換したほかのページ（`Reference` `Comparison` `Digest` `Hub` `NewsArticle` `Start` `About` `Glossary` `Search` `NotFound`）。`Main` `Article` `Header` `Footer` は v10、`Codex*` は検討用の案で、実装には使わない。

実装では前置きのトークンを `src/styles/tokens.css` の CSS custom properties に写し、色や余白をコードに直接書かない。

## Overview

**主役は「検証した日付」。** このサイトの強みは、手順を手元で動かした日と版を載せ、公式の変更を毎朝たどって確かめ直すこと。だから日付と記事番号を、映画の公開日のように大きく見せる。

- **言い切る。** ホームの第一声は「その手順、いま動きますか。」。今朝の確認時刻 `2026.11.15 06:00 CHECKED` と、斜めの検証票（巨大な日付）を並べる。
- **迫力は帯だけ。** 黒い帯（ヘッダー、ページ冒頭、変更の記録）で見せ、本文は白地で静かに組む。LP にはしない。
- **全社を同じ扱いにする。** 骨組みは全社同じ。どの会社がどれだけ載るかは記事のデータから決まる。冒頭の下に、扱う製品を映画のクレジットのように1行で並べる。
- **番号は固定、読む順は変わる。** 記事番号（`CC07`）は作成時に一度だけ付けて変えない。読む順は `products.yaml` の `route` で入れ替える。

## Colors

- **色は青1色に徹する。** リンク、主ボタン、記事番号、英字見出しは `key`。黒い帯の上では、読める明るさの `key-on-band` を使う。ほかの差し色を足さない。製品ごとの色も使わない。
- **白い帯と黒い帯を交互に置く。** ヘッダー、ページ冒頭、変更の記録は `ink-band`。それ以外は `surface`、一覧の地は `surface-soft`。
- **状態の色は文字と小さな札だけ。** 検証済み（`status-ok`）、見直し中（`status-review`）、期限切れ（`status-stale`）。面を塗らない。「対応不要」は緑、「要対応」は琥珀。
- 淡い藤色・生成り・テラコッタ（Anthropic 風）は使わない。

## Typography

- **Anton は英字・数字の見出しだけ。** 区切りの英字見出し（`VERIFIED` `CHANGELOG` `NEWS` など）、日付、記事番号、手順の番号（`01`）、巨大な数字（`404` `24`）に使う。日本語には使わない。
- **区切りの見出しは二段。** 大きな Anton の英字（`clamp(52px, 7.6cqi, 104px)`）＋小さな日本語の見出し（Zen Kaku Gothic New 900、22px）。英字は見出しの一部として読み上げから隠す（`aria-hidden`）。
- **日本語の見出しは Zen Kaku Gothic New 900、本文は BIZ UDPGothic、小さなデータは IBM Plex Mono。**
- Anton の語は途中で改行させない（`white-space: nowrap`）。大きさは画面ではなく欄の幅（`cqi`）で決める。
- 日本語の題は `word-break: auto-phrase` と `text-wrap: balance` で折り返す。1文字だけ次の行に落とさない。

## Layout

- ページの最大幅は 1184px。左右の余白は `max(48px, (100cqi - 1184px) / 2)`、狭い画面では 20px。
- **ページの冒頭は黒い帯。** パンくず → Anton の英字 → 日本語の題 → 1〜2行の説明。右下に巨大な薄い透かし（記事番号・日付・`404` など）を置く。
- 区切りの間は 64px。帯の上下は 40〜56px。
- **狭い画面の判定は画面ではなく欄の幅で行う**（`container-type: inline-size` と `@container`）。キャンバスでは 390px の枠の中に表示されるため。
- 狭い画面では、横に並べた項目を縦に積む。用語集の「言葉・意味・記事」、記事一覧の「表紙・題・状態」も縦にする。ボタンの文字は折り返さない。

## Elevation & Depth

奥行きは「黒い帯と白い面の対比」「背景の巨大な薄い文字」「帯に重ねた白いカード（検証票）」で出す。影は検証票だけに付け、ほかの面は平らにする。

## Shapes

- 操作部品は 6px、カードと表紙は 8px、検証票は 12px、状態の札と絞り込みは丸（999px）。
- 路線の線は帯の背景に細く敷き、主役の1本だけを `key-on-band` で描く。

## Components

- **検証票（ホーム）：** 白いカードを少し傾けて（3度）帯に重ねる。中身は「CC07 / 検証票」、検証済みの札、巨大な日付（Anton）、製品の版と環境、公式の変更の確認結果、記事へのリンク。マウスを当てるとまっすぐに戻る。
- **検証票（記事）：** 題の右に置く。手元で検証した日（Anton）、製品の版、環境、公式の変更、次の見直し、履歴へのリンク。
- **記事一覧の行：** 左に 16:9 の表紙（黒地に青の路線。記事番号から自動で描き、番号を Anton で重ねる）、題、製品・難易度・検証日、右に状態の札。長い記事番号は小さな等幅に切り替える。
- **変更の記録：** 黒い帯に「公式の変更 → 影響の判定 → 再検証」の3枚の札。予定の段は「予定」と書く。
- **ニュース：** 日付、題、対象、右に「対応不要」（緑）か「要対応」（琥珀）と一言。
- **やりたいことから探す：** 罫線の行に題と ↘。アイコンは置かない。
- **空の状態：** 「公開済みの記事はまだありません。」のように、何がないのかを一文で書く。
- **ヘッダー・フッターの部品は、読み込んだページに影響する全体の指定（`a{}` など）を持たない。** ページ側の `a{}` に負けないよう、ヘッダーのリンク色は強い指定で固定する。

## Motion

動きは説明か反応のためだけに、局所的に使う。

- ホーム冒頭：路線の青い1本が描かれ、駅が現れる（約1.6秒、1回だけ）。今朝の確認の点が脈打つ。
- 検証票：マウスを当てると傾きが戻る（弾む動き）。
- 記事一覧：マウスを当てると表紙が少し拡大する。
- 記事：「保存する」の実演（書き換え → PostToolUse → prettier が順に点灯し、字下げが揃う）。
- `prefers-reduced-motion: reduce` ではすべて止め、完成した状態を見せる。

## 書き方

- 段落は2文・80字まで（`npm run check` の `long-paragraph` で検査する）。
- 見出しの上の小さなラベル、英語の飾り文句、画面上の「これはデモです」のような注意書きは置かない。
- 実名・雇用先は書かない。著者は shizukukai。確かめていない値は［要確認］として残す。

## Do's and Don'ts

- **Do** 日付と記事番号を大きく見せる。状態は言葉で書き、色は補うだけにする。
- **Do** 件数・本数・状態はデータから計算して出す。
- **Do** 長い題、空白のない識別子、記事0本の会社、空の一覧を、実装のたびに「最悪」のデータで確かめる。
- **Don't** 差し色を増やさない。製品ごとの色、藤色、グラデーションを使わない。
- **Don't** Anton を日本語や本文に使わない。
- **Don't** 帯の迫力を本文まで持ち込まない（本文は白地で静かに組む）。
- **Don't** 実在の会社のロゴ、作品の意匠、参考サイトの文章を借りない。
