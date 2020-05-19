# 问题描述
最近笔者最近正在将老的项目迁移至typeseript,项目跑起来之后发现antd相关的样式全部丢失，发现webpack打包后css相关的代码没有被提取出来，导致antd的样式全部无效化，原先的webpack配置文件：
```js
module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        query: {
                            presets: [
                                '@babel/react', 
                                '@babel/preset-env'
                            ],
                            plugins: [
                                //  给antd做按需加载
                                ["import", {
                                    "libraryName": "antd",
                                    "libraryDirectory": "es",
                                    "style": "css" // `style: true` 会加载 less 文件
                                }],
                                //  这个拿来做注入代码优化的
                                ['@babel/plugin-transform-runtime',
                                {
                                    "corejs": false,
                                    "helpers": true,
                                    "regenerator": true,
                                    "useESModules": false
                                }],
                                //  支持类写法
                                "@babel/plugin-proposal-class-properties"
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.(css|scss)$/,
                exclude: /node_modules/,
                use: [
                    'isomorphic-style-loader',
                    //  MiniCssExtractPlugin.loader,  //自动提取出css
                    //  'css-loader?modules&localIdentName=[name]__[local]--[hash:base64:5]',
                    {
                        loader: 'typings-for-css-modules-loader',
                        options: {
                            modules: true,
                            namedExport: true
                        }
                    }
                ]
            },
            {
                //  专门处理antd的css样式
                test: /\.(css|less)$/,
                include: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                ],
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader!awesome-typescript-loader',
            }
        ]
    },
    resolve: {
        alias: {
            // '@apiMap': path.resolve(__dirname, 'map/api.tsx'),
            // '@constants': path.resolve(__dirname, 'constants'),
            // '@utils': path.resolve(__dirname, 'utils'),
            // '@UI': path.resolve(__dirname, 'UIwidgets')
        },
        extensions: [
            '.ts', '.tsx', '.js', '.json'
        ]
    },
}
```
# 排查与解决
笔者思考了一下，同时参考网上的相关帖子，感觉可能是tsx文件中引入antd时按需加载的相关逻辑出现了问题，typescript下所有的js文件改写为tsx文件，需要添加新的支持按需加载的插件，即`ts-import-plugin`,将webpack配置文件修改为如下：
```js
    module: {
        rules: [
            //  处理js的babel loader相关配置被删除
            {
                test: /\.(css|scss)$/,
                exclude: /node_modules/,
                use: [
                    'isomorphic-style-loader',
                    {
                        loader: 'typings-for-css-modules-loader',
                        options: {
                            modules: true,
                            namedExport: true
                        }
                    }
                ]
            },
            {
                //  专门处理antd的css样式
                test: /\.css$/,
                include: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                ],
            },
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                options: {
                  useCache: true,
                  useBabel: false, // !important!
                  getCustomTransformers: () => ({
                    before: [tsImportPluginFactory({
                      libraryName: 'antd',
                      libraryDirectory: 'lib',
                      style: true
                    })]
                  }),
                },
                exclude: [
                    /node_modules/
                ]
              }
        ]
    },
```
进行打包之后报错：  
![](https://user-gold-cdn.xitu.io/2020/5/2/171d4a8907161514?w=722&h=192&f=png&s=18998)  
发现是跟解析less文件相关的bug,接下来我们引入`less-loader`,删除对antd的css配置:
```js
            // {
            //     //  专门处理antd的css样式
            //     test: /\.(css|less)$/,
            //     include: /node_modules/,
            //     use: [
            //         MiniCssExtractPlugin.loader,
            //         'css-loader',
            //     ],
            // },
            {
                //  专门处理antd的css样式
                test: /\.(less)$/,
                include: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'less-loader'
                ],
            },
```
继续报错：  
![](https://user-gold-cdn.xitu.io/2020/5/2/171d4c2cb55b5e32?w=716&h=209&f=png&s=26813)  
根据提示，表示less-loader不支持行内javascript，要在选项中开启：
```js
            {
                //  专门处理antd的css样式
                test: /\.(less)$/,
                include: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: "less-loader",
                        options: {
                            lessOptions: {
                                javascriptEnabled: true
                            }
                        }
                    }
                ],
            },
```
网上有些帖子说开启的配置写法是这样的：
```js
    //  网上说的这样改是针对老版本，新版下会报错
    loader: "less-loader",
    options: {
        javascriptEnabled: true
    }
```
实践证明这样的配置写法在新版`less-loader`(6.0.0)中是会报错的。  
再次打包，运行成功。
