import type { NextConfig } from 'next';

const githubPagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const isGithubPagesBuild = Boolean(githubPagesBasePath);

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // GitHub Pages build'inde tamamen statik HTML/CSS/JS üret.
  // Lokal `npm run dev` kullanımında bu ayar devreye girmez.
  ...(isGithubPagesBuild
    ? {
        output: 'export' as const,
        basePath: githubPagesBasePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),

  // Next.js geliştirme modundaki sol alttaki N geliştirici göstergesini gizler.
  devIndicators: false,

  // Proje klasörünü Turbopack kökü olarak kullanır.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
