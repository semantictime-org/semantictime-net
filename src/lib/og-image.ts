// OGP 画像（1200×630）の中身を組み立てる（純粋関数）。描画は src/lib/og-render.ts。
// 色は tokens.css から読む（satori は CSS 変数を解決できないため、値を渡す）。

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const SITE_LABEL = 'semantictime.net';

type Style = Readonly<Record<string, string | number>>;

/** satori に渡す要素（JSX を使わない書き方） */
export interface OgNode {
  readonly type: string;
  readonly props: {
    readonly style?: Style;
    readonly children?: OgNode | string | readonly (OgNode | string)[];
  };
}

export interface OgColors {
  readonly band: string;
  readonly onBand: string;
  readonly onBandFaint: string;
  readonly keyOnBand: string;
}

/** satori の fontFamily に渡す書体名の並び（本文・英字の見出し） */
export interface OgFamilies {
  readonly body: string;
  readonly display: string;
}

const DEFAULT_FAMILIES: OgFamilies = { body: 'BIZ UDPGothic', display: 'Anton' };

export interface OgCardInput {
  /** 記事番号（CC07）、ニュースは NEWS、サイト共通は空でよい */
  readonly mark: string;
  readonly title: string;
  /** 製品名・検証日など */
  readonly sub: string;
}

/** 記事の OGP 画像の置き場所 */
export const ogImagePath = (articleId: string): string => `/og/${articleId}.png`;

const el = (type: string, style: Style, children?: OgNode['props']['children']): OgNode => ({
  type,
  props: children === undefined ? { style } : { style, children },
});

export const ogCard = (
  input: OgCardInput,
  colors: OgColors,
  families: OgFamilies = DEFAULT_FAMILIES,
): OgNode =>
  el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      padding: '64px 72px',
      backgroundColor: colors.band,
      color: colors.onBand,
      fontFamily: families.body,
    },
    [
      el('div', { display: 'flex', fontSize: 28, color: colors.onBandFaint }, SITE_LABEL),
      el('div', { display: 'flex', flexDirection: 'column', gap: 24 }, [
        el(
          'div',
          {
            display: 'flex',
            fontFamily: families.display,
            fontSize: 120,
            lineHeight: 1,
            color: colors.keyOnBand,
          },
          input.mark,
        ),
        el(
          'div',
          { display: 'flex', fontSize: 60, fontWeight: 700, lineHeight: 1.35, lineClamp: 3 },
          input.title,
        ),
      ]),
      el('div', { display: 'flex', fontSize: 30, color: colors.onBandFaint }, input.sub),
    ],
  );

/** tokens.css から変数の値を読む。ない変数はエラー（色を推測で埋めない） */
export const readTokens = <K extends string>(
  css: string,
  names: readonly K[],
): Readonly<Record<K, string>> =>
  Object.fromEntries(
    names.map((name) => {
      const match = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
      if (!match?.[1]) throw new Error(`tokens.css に ${name} がない`);
      return [name, match[1].trim()];
    }),
  ) as Record<K, string>;
