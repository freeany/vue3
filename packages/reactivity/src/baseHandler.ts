import { activeEffect } from "./effect"
import { track } from "./reactiveEffect"
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target,key,receiver){
    if(key === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    // 获取当前正在执行的effect，需要保留下来，也就是说当取值的时候，应该让响应式属性和effect映射起来。
    // console.log(activeEffect, key)
    track(target, key)
    // 需要进行依赖收集
    return Reflect.get(target,key,receiver)
  },
  set(target,key,newValue,receiver) {

    // 找到属性对应的effect重新执行
    // 需要进行触发更新
    return Reflect.set(target, key, newValue, receiver)
  }
}