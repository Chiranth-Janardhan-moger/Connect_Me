module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src',          // Use "@/..." for things in src
            '@components': './components',
            '@assets': './assets',
            '@hooks': './hooks',
            '@constants': './constants',
          },
        },
      ],
    ],
  };
};
