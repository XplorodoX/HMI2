const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:11434',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err);
      }
    })
  );
};
