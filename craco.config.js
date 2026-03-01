const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === "production") {
        // 确保 optimization 和 minimizer 存在
        if (!webpackConfig.optimization) {
          webpackConfig.optimization = {};
        }
        if (!webpackConfig.optimization.minimizer) {
          webpackConfig.optimization.minimizer = [];
        }

        // 查找现有的 TerserPlugin 实例
        const terserIndex = webpackConfig.optimization.minimizer.findIndex(
          (plugin) => plugin.constructor.name === "TerserPlugin"
        );

        if (terserIndex > -1) {
          const existingTerser = webpackConfig.optimization.minimizer[terserIndex];
          
          // 安全地获取现有选项，防止 undefined
          const currentOptions = existingTerser.options || {};
          const currentTerserOptions = currentOptions.terserOptions || {};
          const currentCompress = currentTerserOptions.compress || {};
          const currentMangle = currentTerserOptions.mangle || {};
          const currentFormat = currentTerserOptions.format || {};

          // 修改现有的 Terser 选项以增强混淆和压缩
          existingTerser.options = {
            ...currentOptions,
            terserOptions: {
              ...currentTerserOptions,
              compress: {
                ...currentCompress,
                drop_console: true, // 移除 console 语句
                drop_debugger: true, // 移除 debugger
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'], // 彻底移除 console 调用
              },
              mangle: {
                ...currentMangle,
                toplevel: true, // 混淆顶层作用域变量
              },
              format: {
                ...currentFormat,
                comments: false, // 移除所有注释
              },
            },
            extractComments: false, // 不提取注释到单独文件
          };
        } else {
          // 如果未找到（不太可能，但在某些配置下可能发生），则添加新的
          webpackConfig.optimization.minimizer.push(
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true,
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
                },
                mangle: {
                  toplevel: true,
                },
                format: {
                  comments: false,
                },
              },
              extractComments: false,
            })
          );
        }
      }
      return webpackConfig;
    },
  },
};
