import { isObject } from "@vue/shared/src"
import { activeEffect } from "./effect"
import { track, trigger } from "./reactiveEffect"
import { reactive } from "./reactive"
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers: ProxyHandler<any> = {
  // 需要进行依赖收集
  get(target,key,receiver){
    if(key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    // 获取当前正在执行的effect，需要保留下来，也就是说当取值的时候，应该让响应式属性和effect映射起来。
    // console.log(activeEffect, key)
    track(target, key)
    
    let res = Reflect.get(target, key, receiver)
    if(isObject(res)) {
      return reactive(res) // 懒代理，当取值的时候， 需要对这个对象进行代理，递归代理
    }

    return res
  },
  set(target,key,newValue,receiver) {
    // 先保存旧值,为了对比
    const oldValue = target[key]
    // 需要先设置一下，不然执行run方法的时候还是以前的值
    const result = Reflect.set(target, key, newValue, receiver)
    if(oldValue !== newValue) {
      // 找到属性对应的effect重新执行
      // 需要进行触发更新
      trigger(target, key, newValue, oldValue)
    }
    return result
  }
}