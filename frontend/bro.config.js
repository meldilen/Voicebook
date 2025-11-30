module.exports = {
  apps: {
    '/': {
      name: 'app', 
      version: '0.1.0',
      mount: '#root'
    }
  },
  
  webpackConfig: {
    entry: './src/index.js',
    output: {
      publicPath: '/'
    },
    devServer: {
      port: 3000,
      historyApiFallback: {
        index: '/index.html'
      }
    },
    resolve: {
      extensions: ['.jsx', '.js', '.tsx', '.ts', '.json']
    }
  },
  
  html: true,
  useCustomHTML: true
};