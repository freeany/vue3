import minimist from "minimist";
import { resolve, dirname } from 'path'
import { fileURLToPath } from "url";
import { createRequire } from "module";
import esbuild from 'esbuild'

const require = createRequire(import.meta.url)
// import.meta.url获取文件的绝对路径 file:
// 使用fileURLToPath变为 /usr/**/dev.js 的路径
const __filename = fileURLToPath(import.meta.url)
// 获取当前模块的目录名，也就是node中的__dirname
const __dirname = dirname(__filename)
// node中的命令行参数通过process 来获取 process.argv
const args = minimist(process.argv.slice(2))

const target = args._[0] || 'reactivity'; // 要打包哪个项目
const format = args.f || 'iife' // 打包后的模块规范


// 入口文件，根据命令行提供的路径来解析
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
// __dirname: /Users/lihaoran/Library/Containers/com.apple.iWork.Pages/Data/我的文件/AAA/vue3-code/vue3/scripts

const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))

esbuild.context({
  entryPoints: [entry],
  outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), // 出口
  bundle: true, // reactivity -> shared 会打包到一起
  platform: 'browser', // 打包后的文件给浏览器使用
  sourcemap: true, // 可以调试源代码
  format,
  globalName: pkg.buildOptions?.name
}).then((ctx) => {
  console.log('start dev');
  return ctx.watch()
})
