/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure both Webpack and Turbopack for lodash resolution
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configure webpack to resolve lodash submodules properly
    config.resolve.alias = {
      ...config.resolve.alias,
      // Map lodash submodule imports to the correct paths
      'lodash/every': 'lodash/every',
      'lodash/find': 'lodash/find',
      'lodash/flatMap': 'lodash/flatMap',
      'lodash/get': 'lodash/get',
      'lodash/isBoolean': 'lodash/isBoolean',
      'lodash/isEqual': 'lodash/isEqual',
      'lodash/isFunction': 'lodash/isFunction',
      'lodash/isNil': 'lodash/isNil',
      'lodash/isNumber': 'lodash/isNumber',
      'lodash/isObject': 'lodash/isObject',
      'lodash/isString': 'lodash/isString',
      'lodash/keys': 'lodash/keys',
      'lodash/map': 'lodash/map',
      'lodash/mapValues': 'lodash/mapValues',
      'lodash/max': 'lodash/max',
      'lodash/maxBy': 'lodash/maxBy',
      'lodash/memoize': 'lodash/memoize',
      'lodash/min': 'lodash/min',
      'lodash/minBy': 'lodash/minBy',
      'lodash/range': 'lodash/range',
      'lodash/reduce': 'lodash/reduce',
      'lodash/some': 'lodash/some',
      'lodash/sortBy': 'lodash/sortBy',
      'lodash/throttle': 'lodash/throttle',
      'lodash/uniqBy': 'lodash/uniqBy',
      'lodash/upperFirst': 'lodash/upperFirst',
      'lodash/values': 'lodash/values',
      'lodash/isNaN': 'lodash/isNaN',
      'lodash/last': 'lodash/last',
      'lodash/isPlainObject': 'lodash/isPlainObject',
    };

    return config;
  },
  // Turbopack configuration for Next.js 15 (stable)
  turbopack: {
    resolveAlias: {
      // Map lodash submodule imports for Turbopack
      'lodash/every': 'lodash/every',
      'lodash/find': 'lodash/find',
      'lodash/flatMap': 'lodash/flatMap',
      'lodash/get': 'lodash/get',
      'lodash/isBoolean': 'lodash/isBoolean',
      'lodash/isEqual': 'lodash/isEqual',
      'lodash/isFunction': 'lodash/isFunction',
      'lodash/isNil': 'lodash/isNil',
      'lodash/isNumber': 'lodash/isNumber',
      'lodash/isObject': 'lodash/isObject',
      'lodash/isString': 'lodash/isString',
      'lodash/keys': 'lodash/keys',
      'lodash/map': 'lodash/map',
      'lodash/mapValues': 'lodash/mapValues',
      'lodash/max': 'lodash/max',
      'lodash/maxBy': 'lodash/maxBy',
      'lodash/memoize': 'lodash/memoize',
      'lodash/min': 'lodash/min',
      'lodash/minBy': 'lodash/minBy',
      'lodash/range': 'lodash/range',
      'lodash/reduce': 'lodash/reduce',
      'lodash/some': 'lodash/some',
      'lodash/sortBy': 'lodash/sortBy',
      'lodash/throttle': 'lodash/throttle',
      'lodash/uniqBy': 'lodash/uniqBy',
      'lodash/upperFirst': 'lodash/upperFirst',
      'lodash/values': 'lodash/values',
      'lodash/isNaN': 'lodash/isNaN',
      'lodash/last': 'lodash/last',
      'lodash/isPlainObject': 'lodash/isPlainObject',
    },
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lodash'],
  },
  // Transpile packages that might need it
  transpilePackages: ['recharts'],
};

module.exports = nextConfig;