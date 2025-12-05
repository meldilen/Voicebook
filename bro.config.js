const pkg = require('./package')

module.exports = {
    pageTitle: 'AI Bridge',
    webpackConfig: {
        output: {
            publicPath: `/static/${pkg.name}/${process.env.VERSION || pkg.version}/`
        }
    },
    navigations: {
        'voice-book.main': '/',
    },
    features: {
        'voice-book': {
            // add your features here in the format [featureName]: { value: string }
        },
    },
    config: {
        'voice-book.api': "/api/v1",
    }
}