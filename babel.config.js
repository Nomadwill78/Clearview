module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@constants': './constants',
            '@lib': './lib',
            '@store': './store',
            '@hooks': './hooks',
            '@components': './components',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
