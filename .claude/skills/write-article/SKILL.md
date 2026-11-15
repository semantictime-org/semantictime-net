---
name: write-article
description: semantictime.net の記事を下書きするときの手順と決まり。記事を書く、下書きを作る、記事を直す、新しいページを追加する、といった依頼のときに使う。置き場所、frontmatter、書き方、検証との分担、push までを扱う。
---

# 記事を書く（semantictime.net）

記事は「人が実機で確かめたこと」を載せる場所。Claude は下書きと整理を担い、検証と公開の判断は人（shizukukai）が行う。

## 1. 始める前に

- ブランチは `content/<slug>` を main から作る。PR は push すると GitHub App が作るので、自分では作らない。
- 1日1本は目標で、上限ではない。急がせない。
- 扱う機能が `src/data/features.yaml` にあるか確かめる。なければ、記事より先に機能を追加する（別の `fix/` ブランチ）。

## 2. 置き場所

`src/content/articles/<product>/<slug>.mdx`（ニュースは `src/content/articles/news/<slug>.mdx`）

- `<product>` は frontmatter の `products` の先頭と同じにする。値は `src/data/products.yaml` の `id`（例 `claude-code` `claude-api` `chatgpt` `codex` `gemini` `midjourney`）。
- 新しい製品を扱うときは、先に `products.yaml` に製品（`id`・`name`・`vendor`・2 文字の `code`・`categories`）を足す。
- `<slug>` は英小文字・数字・ハイフンだけ（例 `hooks-format-on-save`）。

## 3. frontmatter

```yaml
---
title: Hooks で、保存のたびに整形を走らせる # 80 字まで
description: ファイルを書き換えたあとに… # 50〜160 字。検索結果に出る文
type: how-to # tutorial / how-to / reference / explanation / troubleshooting / comparison / news / landing
products: [claude-code] # 先頭がその記事の路線（置き場所）。ニュースは [] でもよい
stationNo: 7 # 記事番号（CC07 の 07）。その製品の最大の番号 + 1 を一度だけ付け、以後変えない。ニュースは書かない
verification: hands-on # hands-on（手元で検証）か sources（一次情報の出典で確認。ニュースは必ずこれ）
roles: [developer] # developer / business
level: intermediate # beginner / intermediate / advanced
features: [hooks] # features.yaml の id
draft: true # 人が実機で確かめるまでは true のまま
publishedAt: 2026-11-15 # 公開する日（JST）。未来の日付や、既存の記事より前の日付は CI で失敗する
verifiedAt: 2026-11-15 # 人が実機で確かめた日。公開前に確かめたなら publishedAt より前でよい
verifiedWith: # hands-on のときは必須
  claudeCode: 2.1.325 # 確かめた版。model・apiVersion・version（ほかの製品の版）でもよい（最低1つ）
sources:
  - https://code.claude.com/docs/en/hooks
owner: shizukukai
aiAssisted: draft # Claude が下書きしたら draft。人が大きく書き直したら draft-and-edit
---
```

- `changes` は `type: news` のときだけ書く。各項目の `product` は products.yaml の `id`。
- 読む順は記事ではなく `products.yaml` の `route` に slug を足して決める。入れ替えても `stationNo` と URL は変えない（入れ替えた日を `routeUpdated` に書く）。
- `verifiedAt` と `verifiedWith` は、人が確かめた結果を書く欄。Claude が自分で動かしていない内容を「検証した」と書かない。分からないときは人に聞く。

## 4. 書き方

- **公式の文章を転載しない。** 自分の言葉で書き直す。引用は必要最小限にし、出典を `sources` と本文の両方に示す。
- 文体はですます調。一文は短く、読点は3つまで。`npm run lint:text`（textlint の技術文書向けの規則）を通す。
- 結論を先に書く。手順は番号つきの箇条書きにし、1つの手順で1つの操作にする。
- **読ませる前に、見て分からせる**（DESIGN.md「文字を減らし、図で見せる」）。
  - 段落は2文・80字まで。超えると本文の検査（`long-paragraph`）で失敗する。超えたら、箇条書き・表・図にできないか先に考える。
  - 節（`##`）は文章から始めず、箇条書き・表・コード・図のどれかから始める。
  - 本文（コードを除く）は 600 字を目安にする。ハウツーで超えたら、記事を分けるか図にする。現行仕様の記事は表が主なので、目安から外してよい。
  - 冒頭には、ゴール（いま → 読んだあと）、所要時間・難しさ・必要なプラン・前に読む記事、手順の全体（1・2・3）を置く。
  - 困ったときは「症状 → 見るところ」の形で並べる。
  - 図や画面写真には、内容を一文で書いた説明（代替テキスト）を付ける。
- 版や日付で変わる値（料金、上限、モデル名）は、本文に固定で書かず、出典にリンクする。
- 使えるコンポーネントは `<Callout>` だけ。それ以外の JSX や生の HTML（`<script>` など）は、本文の検査で失敗する。
- 内部リンクは `/claude-code/hooks/` の形で書く。存在しないページへのリンクは失敗する。
- 実名、雇用先の名前、社内の情報、顧客の事例は書かない。著者は shizukukai。

## 5. 人との分担

1. Claude：`draft: true` で下書きし、push する。
2. 人：手元で手順を動かして確かめる。結果（確かめた日、版、直すべき点）を Claude に伝える。
3. Claude：結果を反映し、`verifiedAt`・`verifiedWith` を更新し、公開するときは `draft: false` にして push する。
4. 人：PR 本文の検証の節で、記事の verification に合う印（hands-on は「実機で検証した」、sources は「一次情報の出典を確かめた」）を付け、Squash でマージする。push のたびに印は自動で外れる。

### まとめて公開するとき（サイトの公開前など）

- 下書き（`draft: true`）は、製品ごとにまとめて1つの PR にしてよい。記事番号と route の更新が1つの PR の中で決まるので、PR どうしでぶつからない。
- 下書きだけの PR は検証ゲートの対象外なので、人の印なしでマージしてよい。
- 検証が済んだ記事は、`verifiedAt` に実際に確かめた日を書く。公開日より前でよい。
- 公開する日には「公開する PR」を1本作る。検証が済んだ記事だけを `draft: false` にし、`publishedAt` をその日にする。公開する記事の一覧と各記事の検証日をコミットのメッセージに書く（PR の本文は Claude からは編集できない）。人は、その PR で印を付ける。

## 6. 終える前に

```bash
npm run check   # lint → 本文の検査 → 文章の検査 → 型 → テスト → ビルド
```

失敗したら直してから push する。push したら、PR の番号と、人に確かめてほしい点を伝える。
