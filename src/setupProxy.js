const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Handle all API requests
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '' 
      }
    })
  );
  

  app.use(
    '/avatars',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );
  
  
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      ws: true
    })
  );
};