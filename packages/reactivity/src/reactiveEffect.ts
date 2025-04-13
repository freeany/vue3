import { activeEffect } from "./effect";

export function track(target: any, key: any) {
  // 如果有activeEffect，则说明这个key是在effect中访问的，没有则说明是在effect之外访问的，不用进行依赖收集

  if(activeEffect) {
    console.log(target, key, activeEffect);
  }
}

// {obj: {属性： {effect1, effect2}}}

/**
  {
    {name: 'qq', age: 30}: {
        name: {
          effect
        },
        age: {
          effect, effect
        }
    }
  }
 */