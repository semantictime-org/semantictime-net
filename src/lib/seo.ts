// ページのメタ情報（title、canonical、OGP、JSON-LD、robots、計測）を決める（純粋関数）。
// 出力は src/components/seo/SeoHead.astro で行う。

export const DEPLOY_ENVS = ['preview', 'test', 'production'] as const;
/** preview：下書きを含め noindex／test：E2E と Lighthouse 用（noindex なし・計測なし）／production：計測あり */
export type DeployEnv = (typeof DEPLOY_ENVS)[number];

const DEFAULT_ENV: DeployEnv = 'test';
const NOINDEX = 'noindex,nofollow';
const FILE_EXTENSION = /\/[^/]+\.[a-z0-9]+$/i;
const INDEX_HTML = /\/index\.html$/;

const isDeployEnv = (value: string): value is DeployEnv =>
  (DEPLOY_ENVS as readonly string[]).includes(value);

/** 環境変数 PUBLIC_DEPLOY_ENV を読む。未設定なら test、知らない値ならビルドを止める */
export const parseDeployEnv = (raw: string | undefined): DeployEnv => {
  if (raw === undefined || raw === '') return DEFAULT_ENV;
  if (!isDeployEnv(raw)) {
    throw new Error(`PUBLIC_DEPLOY_ENV は ${DEPLOY_ENVS.join(' / ')} のどれか（値: ${raw}）`);
  }
  return raw;
};

export interface SeoArticle {
  readonly author: string;
  readonly publishedAt: Date;
  readonly modifiedAt: Date;
}

export interface SeoInput {
  readonly siteUrl: string;
  readonly siteName: string;
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly analyticsToken: string | undefined;
  /** 記事のときだけ渡す（JSON-LD が Article になる） */
  readonly article?: SeoArticle;
}

export interface Seo {
  readonly documentTitle: string;
  readonly description: string;
  readonly canonical: string;
  readonly robots: string | undefined;
  readonly analyticsToken: string | undefined;
  readonly og: {
    readonly type: 'article' | 'website';
    readonly url: string;
    readonly title: string;
    readonly description: string;
    readonly siteName: string;
  };
  readonly jsonLd: Readonly<Record<string, string | Readonly<Record<string, string>>>>;
}

/** クエリ・アンカー・index.html を除き、ファイル以外は末尾を / にそろえる */
const normalizePath = (path: string): string => {
  const bare = (path.split(/[?#]/)[0] ?? '/').replace(INDEX_HTML, '/');
  if (FILE_EXTENSION.test(bare) || bare.endsWith('/')) return bare;
  return `${bare}/`;
};

export const buildSeo = (input: SeoInput & { readonly env: DeployEnv }): Seo => {
  const { siteUrl, siteName, title, description, path, env, article } = input;
  const canonical = `${siteUrl}${normalizePath(path)}`;
  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        url: canonical,
        author: { '@type': 'Person', name: article.author },
        datePublished: article.publishedAt.toISOString(),
        dateModified: article.modifiedAt.toISOString(),
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteName,
        description,
        url: canonical,
      };
  return {
    documentTitle: title === siteName ? siteName : `${title} | ${siteName}`,
    description,
    canonical,
    robots: env === 'preview' ? NOINDEX : undefined,
    analyticsToken: env === 'production' ? input.analyticsToken : undefined,
    og: {
      type: article ? 'article' : 'website',
      url: canonical,
      title,
      description,
      siteName,
    },
    jsonLd,
  };
};
