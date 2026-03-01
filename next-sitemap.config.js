/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://sports-nurse-web.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/admin/*',
    '/api/*',
    '/dashboard/*',
    '/inbox/*',
    '/orders/*',
    '/attendance/*',
    '/reviews/*',
    '/reports/*'
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/inbox/',
          '/orders/',
          '/attendance/',
          '/reviews/',
          '/reports/'
        ]
      }
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://sports-nurse-web.vercel.app'}/sitemap.xml`
    ]
  },
  transform: async (config, path) => {
    // 動的ルートの優先度設定
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined
      };
    }
    
    if (path === '/jobs') {
      return {
        loc: path,
        changefreq: 'hourly',
        priority: 0.9,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined
      };
    }
    
    if (path.startsWith('/jobs/')) {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined
      };
    }
    
    // デフォルト設定
    return {
      loc: path,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined
    };
  }
};