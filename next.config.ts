import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  // Dist directory isolated from `out/` so a locked export folder (file watcher,
  // antivirus, an open editor tab) cannot fail the build at its last step.
  const DIST = process.env.NEXT_DIST_DIR ?? ".next";
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    // Kept out of `out/` so an export folder that some process still holds —
    // a dev server, an antivirus scan, an editor tab — cannot fail the build
    // at its final step. The export still lands in `out/`; only the working
    // directory moves.
    distDir: DIST,

    // 静态导出到 ./out (URL = .html 后缀，零 301 重定向)
    output: "export",
    trailingSlash: false,

    // 开发态默认只放行 localhost。用 http://127.0.0.1:3000 打开时，
    // /_next/hmr 会被判定为跨源并拦截 —— 页面能看，但热更新是坏的，
    // 改代码没有任何反应。开发服务器本身已经放行 localhost，这里只补 IP。
    allowedDevOrigins: ["127.0.0.1"],

    // 静态导出需要禁用 image optimization（用 next/image 静态打包）
    images: {
      unoptimized: true,
    },

    // 允许打包 server-only 模块；静态导出会报错的要在客户端排除
    experimental: {
      // 暂留空位，未来按需打开
    },

    // 静态导出兼容 turbopack
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },

    // 全站内链都带 .html 后缀（导出目录里就是 xxx.html），但 dev server
    // 只认扩展名-less 的 App Router 路由 —— 不加这条，本地预览里点导航、
    // "Get a Quote"、页脚链接、Sign in 全部 404，预览等于不能用。
    // 仅开发期挂载：导出产物由静态托管直接提供 .html 文件，
    // 生产构建不经过 rewrite，行为与上线完全一致。
    // 注意 Next 16 的 rewrites 必须是函数（config-schema.js: z.function()），
    // 直接给对象会被判为 invalid config 而静默不生效。
    ...(isDev
      ? {
          rewrites: async () => ({
            beforeFiles: [
              // 首页导出为 /index.html，但路由名是 / —— 单独兜一条。
              //
              // 这条规则在静态导出里不生效：导出没有服务器来回答重定向，
              // 真正回答它的是 nginx（见 /etc/nginx/conf.d/shenhe-site.conf
              // 里的 "if ($uri = /index.html) { return 301 /; }"）。
              // 留在这里是为了将来换成 Node 运行时；站内的链接一律写 "/"。
              { source: "/index.html", destination: "/" },
              { source: "/:path*.html", destination: "/:path*" },
            ],
            afterFiles: [],
            fallback: [],
          }),
        }
      : {}),
  };
};

export default nextConfig;
