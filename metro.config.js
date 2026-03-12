const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

config.resolver.resolverMainFields = [
  'browser',
  'module', 
  'main',
]

config.resolver.platforms = ['ios', 'android', 'native', 'web']

module.exports = config