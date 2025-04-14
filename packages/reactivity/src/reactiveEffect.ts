import { activeEffect, trackEffect, triggerEffects } from "./effect";

// 存放依赖收集关系的容器
const targetMap = new WeakMap();

function createDep(cleanUp, key) {
  const effectsMap = new Map() as any
  effectsMap.name = key
  effectsMap.cleanUp = cleanUp
  return effectsMap
}

export function track(target: any, key: any) {
  // 如果有activeEffect，则说明这个key是在effect中访问的，没有则说明是在effect之外访问的，不用进行依赖收集
  
  if (activeEffect) {
    // console.log(target, key, activeEffect);

    let depsMap = targetMap.get(target)
    if (!depsMap) { // 说明此属性是新增的
      targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key)))
    }


    // 将当前的effect存放到deps(映射表)中，后面key发生变化的时候触发dep中存放的effect
    trackEffect(activeEffect, dep)
  }

}

// {obj: {属性： {effect1, effect2}}}

/**
 
  effect(() => {
      document.getElementById('app').innerHTML = `${data.name}---${data.age}`
  })

  effect(() => {
    document.getElementById('app').innerHTML = `${data.name}`
  })

  {
    {name: 'qq', age: 30}: {
        name: {
          effect, effect
        },
        age: {
          effect
        }
    }
  }
 */




export function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    // 找不到这个对象，则说明这个对象在effect中，不处理
    return
  }
  const dep = depsMap.get(key)

  if(dep) {
    // 将key对应的所有effect执行
    triggerEffects(dep)
  }
}