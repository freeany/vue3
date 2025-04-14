// packages/shared/src/index.ts
function isObject(val) {
  return typeof val === "object" ? val : null;
}

// packages/reactivity/src/effect.ts
var activeEffect;
function preCleanEffect(effect2) {
}
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  return _effect;
}
var ReactiveEffect = class {
  // fn是用户编写的函数
  // 如果fn中依赖的数据发生变化之后，需要重新调用 run方法
  constructor(fn, sheduler) {
    this.fn = fn;
    this.sheduler = sheduler;
    this._trackId = 0;
    // 用于记录当前effect执行了几次
    this.deps = [];
    // 记录存放了哪些依赖
    this._depsLength = 0;
    // 收集了几个
    this.active = true;
  }
  // 执行effect传入的函数
  run() {
    if (!this.active) {
      return this.fn();
    }
    let lastEffective = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this);
      return this.fn();
    } finally {
      activeEffect = lastEffective;
    }
  }
};
function trackEffect(effect2, dep) {
  console.log(effect2, dep, "trackeffect");
  dep.set(effect2, effect2._trackId);
  effect2.deps[effect2._depsLength++] = dep;
}
function triggerEffects(dep) {
  for (const effect2 of dep.keys()) {
    if (effect2.sheduler) {
      effect2.sheduler();
    }
  }
}

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new WeakMap();
function createDep(cleanUp, key) {
  const effectsMap = /* @__PURE__ */ new Map();
  effectsMap.name = key;
  effectsMap.cleanUp = cleanUp;
  return effectsMap;
}
function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = createDep(() => depsMap.delete(key), key));
    }
    trackEffect(activeEffect, dep);
  }
}
function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
}

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, newValue, receiver) {
    const oldValue = target[key];
    const result = Reflect.set(target, key, newValue, receiver);
    if (oldValue !== newValue) {
      trigger(target, key, newValue, oldValue);
    }
    return result;
  }
};

// packages/reactivity/src/reactive.ts
function reactive(target) {
  return createReactiveObject(target);
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
function createReactiveObject(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const existProxy = reactiveMap.get(target);
  if (existProxy) {
    return existProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
export {
  activeEffect,
  effect,
  reactive,
  trackEffect,
  triggerEffects
};
//# sourceMappingURL=reactivity.js.map
