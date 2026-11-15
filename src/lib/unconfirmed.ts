// 人が確かめていない箇所（［要確認］）の扱い。本番のビルドに残っていたら、ビルドを止める。
import type { DeployEnv } from './seo.ts';

export const unconfirmedLabel = (note: string, env: DeployEnv): string => {
  if (env === 'production') {
    throw new Error(`［要確認］が残っているので本番のビルドを止めた: ${note}`);
  }
  return `［要確認：${note}］`;
};
