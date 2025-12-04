const pkg = require('./package.json')
const webpack = require('webpack')
const path = require('path')

module.exports = {
  apiPath: 'stubs/api',
  webpackConfig: {
    output: {
      publicPath: `/static/${pkg.name}/${process.env.VERSION || pkg.version}/`
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  },
  navigations: {
    'voice-book.main': '/voice-book',
    'voice-book.home': '/voice-book/home',
    'voice-book.profile': '/voice-book/profile'
  },
  features: {
    'voice-book': {
      'analytics': { value: 'enabled' },
      'voice-recording': { value: 'enabled' }
    },
  },
  config: {
    'voice-book.api': '/api',
    'voice-book.ws': '/ws'
  }
}