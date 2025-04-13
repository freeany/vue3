export let activeEffect: any
// 我们要创建一个可响应式的effect， 数据变化之后可以重新执行
export function effect(fn: any, options?: any) {

  // 创建一个effect， 只要依赖的属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })

  _effect.run()
  return _effect
}

class ReactiveEffect {
  active = true
  // fn是用户编写的函数
  // 如果fn中依赖的数据发生变化之后，需要重新调用 run方法
  constructor(public fn: any, public sheduler: any) {}
  
  // 执行effect传入的函数
  run() {
    // 如果不是激活响应式的对象，则执行完就完事了，不用进行依赖收集
    if(!this.active) {
      return this.fn()
    }

    // 执行依赖收集
    // lastEffective和activeeffective类似于一种父子关系，伪递归形成的父子关系
    // 也可以用栈的方式，都是一样的
    let lastEffective = activeEffect
    try {
      activeEffect = this
      return this.fn()
    } finally {
      activeEffect = lastEffective
    }
  }
}