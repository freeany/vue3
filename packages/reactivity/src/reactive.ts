import { isObject } from "@vue/shared/src"
import { mutableHandlers, ReactiveFlags } from "./baseHandler"
export function reactive(target: any) {
  return createReactiveObject(target)
}

// 建立缓存对象，如果两个对象都被reactive，那么返回的对象是相同的，这也是一种小优化
/**
 * 为了解决这个问题：
 const data = {
    name: 'qq',
    age: 123
  }
  const p1 = reactive(data)
  const p2 = reactive(data)
  console.log(p1 === p2); // 需要是true
 */
const reactiveMap = new WeakMap()




function createReactiveObject(target: any) {
  if(!isObject(target)) {
    return target
  }

  // 传进来的对象是否是已经被vue的reactive代理后的对象
  /*
    const data = {
      name: 'qq',
      age: 123
    }
    const p1 = reactive(data)
    const p2 = reactive(p1)
    console.log(p1 === p2); // 需要是true
   */
  if(target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  const existProxy = reactiveMap.get(target)
  if(existProxy) {
    return existProxy
  }

  const proxy = new Proxy(target, mutableHandlers)

  // 缓存代理结果
  reactiveMap.set(target, proxy)
  return proxy
}