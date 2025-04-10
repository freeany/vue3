import minimist from "minimist";

// node中的命令行参数通过process 来获取 process.argv
const args = minimist(process.argv.slice(2))

const target = args._[0] || 'reactivity'; // 要打包哪个项目
const format = args.f || 'iife' // 打包后的模块规范
console.log(target, format);


console.log(args);
