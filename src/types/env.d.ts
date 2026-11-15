// ビルド時に渡す環境変数（src/lib/seo.ts の parseDeployEnv で検査する）
interface ImportMetaEnv {
  readonly PUBLIC_DEPLOY_ENV?: string;
}
