// OGP 画像を PNG にする（ビルドのときだけ動く）。書体は npm の @fontsource（WOFF）から読む。
// satori は WOFF2 を読めないので WOFF を使う。書体と色は一度だけ読み、全記事で使い回す。
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import {
  OG_HEIGHT,
  OG_WIDTH,
  ogCard,
  readTokens,
  type OgCardInput,
  type OgColors,
  type OgFamilies,
} from './og-image.ts';

const FONTSOURCE = join(process.cwd(), 'node_modules', '@fontsource');
const TOKENS_FILE = join(process.cwd(), 'src', 'styles', 'tokens.css');

type FontWeight = 400 | 700;

const SUBSET = /^.+-(.+)-(400|700)-normal\.woff$/;

/**
 * @fontsource の書体は文字の範囲ごとにファイルが分かれている。satori は同じ名前の書体を
 * 1 つしか使わないので、範囲ごとに別の名前を付け、fontFamily にその名前を全部並べて代わりの書体にする。
 */
const loadFamily = (pkg: string, name: string, weights: readonly FontWeight[]) => {
  const dir = join(FONTSOURCE, pkg, 'files');
  const fonts = readdirSync(dir).flatMap((f) => {
    const match = SUBSET.exec(f);
    const weight = Number(match?.[2]);
    if (!match || !weights.some((w) => w === weight)) return [];
    return [
      {
        name: `${name} ${match[1] ?? ''}`,
        data: readFileSync(join(dir, f)),
        weight: weight === 700 ? (700 as const) : (400 as const),
        style: 'normal' as const,
      },
    ];
  });
  if (fonts.length === 0) throw new Error(`${pkg} に WOFF がない`);
  return { fonts, family: [...new Set(fonts.map((f) => f.name))].join(', ') };
};

let cache:
  | { fonts: ReturnType<typeof loadFamily>['fonts']; colors: OgColors; families: OgFamilies }
  | undefined;

const assets = () => {
  if (cache) return cache;
  const t = readTokens(readFileSync(TOKENS_FILE, 'utf8'), [
    '--color-band',
    '--color-on-band',
    '--color-on-band-faint',
    '--color-key-on-band',
  ]);
  const body = loadFamily('biz-udpgothic', 'BIZ UDPGothic', [400, 700]);
  const display = loadFamily('anton', 'Anton', [400]);
  cache = {
    fonts: [...body.fonts, ...display.fonts],
    families: { body: body.family, display: display.family },
    colors: {
      band: t['--color-band'],
      onBand: t['--color-on-band'],
      onBandFaint: t['--color-on-band-faint'],
      keyOnBand: t['--color-key-on-band'],
    },
  };
  return cache;
};

export const renderOgPng = async (input: OgCardInput): Promise<Uint8Array<ArrayBuffer>> => {
  const { fonts, colors, families } = assets();
  const svg = await satori(ogCard(input, colors, families), {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });
  // Response に渡せる形（ArrayBuffer を持つ Uint8Array）に写す
  return new Uint8Array(new Resvg(svg).render().asPng());
};
