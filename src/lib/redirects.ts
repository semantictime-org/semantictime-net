// Cloudflare の _redirects（public/_redirects）を読む（T063）。純粋関数。
// 恒久的な移動だけを書く決まりなので、ステータスは 301 だけを認める。

export interface Redirect {
  readonly from: string;
  readonly to: string;
  readonly status: 301;
}

const PERMANENT = 301;

export const parseRedirects = (text: string): readonly Redirect[] =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
    .map((line) => {
      const [from = '', to = '', status] = line.split(/\s+/);
      if (Number(status) !== PERMANENT) {
        throw new Error(`_redirects は 301 だけにする: ${line}`);
      }
      return { from, to, status: PERMANENT };
    });
