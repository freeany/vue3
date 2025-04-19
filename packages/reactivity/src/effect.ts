export let activeEffect: any

// 清空effect
function preCleanEffect(effect: ReactiveEffect) {
  effect._depsLength = 0;
  effect._trackId++; // 每次执行 id+1，如果同一个effect执行，id就是相同的。
}

// 清除多余的effect
function postCleanEffect(effect: ReactiveEffect) {
  // [flag, name, aa, bb, cc]
  //  ｜
  // [flag]
  if(effect.deps.length > effect._depsLength) {
    for(let i = effect._depsLength; i< effect.deps.length;i++) {
      cleanEffect(effect.deps[i], effect) // 删除映射表中对应的effect
    }
    effect.deps.length = effect._depsLength // 更新依赖列表的长度
  } 
}

function cleanEffect(dep, effect) {
  dep.delete(effect)
  if(dep.size === 0) {
    dep.cleanUp() // 如果map为空，则删掉此属性
  }
}

// 我们要创建一个可响应式的effect， 数据变化之后可以重新执行
export function effect(fn: any, options?: any) {
  // 创建一个effect， 只要依赖的属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run()
  })

  _effect.run()

  // 将用户传入的选项覆盖现有的配置，用户可以去决定如何自定义调度， 如{ scheduler: () => {} }
  if(options) {
    Object.assign(_effect, options)
  }

  const runner = _effect.run.bind(_effect) // 将源码内部的runner暴露出去。这样可以实现用户自定义runner的aop
  runner._effect = _effect

  return runner
}

class ReactiveEffect {
  _trackId = 0; // 用于记录当前effect执行了几次,(防止一个属性在当前effect中多次依赖收集)  只收集一次
  deps:any = []; // 记录存放了哪些依赖
  _depsLength = 0; // 收集了几个

  active = true
  // fn是用户编写的函数
  // 如果fn中依赖的数据发生变化之后，需要重新调用 run方法
  constructor(public fn: any, public scheduler: any) {}
  
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
      
      // 在effect重新执行之前,需要将上一次的依赖情况清空
      preCleanEffect(this)
      // 重新收集依赖
      return this.fn()
    } finally {
      postCleanEffect(this)
      activeEffect = lastEffective
    }
  }
}

/**
 * dep就是age: {effect, effect}; 后面的effect effect
 * 收集依赖
 * 进行双向记忆
 * 
 * 1. _trackId用于记录执行次数(防止一个属性在当前effect中多次依赖收集)， 只收集一次
 * 2. 拿到上一次依赖(dep)的第一个和这次的比较。 （姜老师写的是最后一个，这里有异议） 
 */
export function trackEffect(effect: InstanceType<typeof ReactiveEffect>, dep: any) {
  
  // console.log(effect, dep,'trackeffect');
  // 先进行去重操作
  if(dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId)

    // 主要是处理这个问题
    // {flag,name} 
    //     |  到     
    // {flag,age}

    const oldDep = effect.deps[effect._depsLength]

    if(oldDep !== dep) {
      if(oldDep) {
        // 删除老的
        cleanEffect(dep, effect)
      }
      effect.deps[effect._depsLength++] = dep
    }else {
      effect._depsLength++
    }

  }
  
  
  
  // dep.set(effect, effect._trackId);
  // effect.deps[effect._depsLength++] = dep
}


// 将所有的dep进行触发
export function triggerEffects(dep: any) {
  for(const effect of dep.keys()) {
    if(effect.scheduler) {
      effect.scheduler()
    }
  }
}

