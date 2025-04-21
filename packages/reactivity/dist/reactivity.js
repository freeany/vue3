// packages/shared/src/index.ts
function isObject(val) {
  return typeof val === "object" ? true : null;
}
function isFunction(val) {
  return typeof val === "function" ? true : false;
}

// packages/reactivity/src/effect.ts
var activeEffect;
function preCleanEffect(effect2) {
  effect2._depsLength = 0;
  effect2._trackId++;
}
function postCleanEffect(effect2) {
  if (effect2.deps.length > effect2._depsLength) {
    for (let i = effect2._depsLength; i < effect2.deps.length; i++) {
      cleanEffect(effect2.deps[i], effect2);
    }
    effect2.deps.length = effect2._depsLength;
  }
}
function cleanEffect(dep, effect2) {
  dep.delete(effect2);
  if (dep.size === 0) {
    dep.cleanUp();
  }
}
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (options) {
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  runner._effect = _effect;
  return runner;
}
var ReactiveEffect = class {
  // fn是用户编写的函数
  // 如果fn中依赖的数据发生变化之后，需要重新调用 run方法
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this._trackId = 0;
    // 用于记录当前effect执行了几次,(防止一个属性在当前effect中多次依赖收集)  只收集一次
    this._depsLength = 0;
    // 收集了几个
    this._running = 0;
    // 是否正在执行
    this.deps = [];
    // 记录存放了哪些依赖
    this._dirtyLevel = 4 /* Dirty */;
    // 是否是脏的，只供computed使用
    this.active = true;
    this._dirty = true;
  }
  get dirty() {
    return this._dirtyLevel === 4 /* Dirty */;
  }
  set dirty(v) {
    this._dirtyLevel = v ? 4 /* Dirty */ : 0 /* NoDirty */;
  }
  // 执行effect传入的函数
  run() {
    this._dirtyLevel = 0 /* NoDirty */;
    if (!this.active) {
      return this.fn();
    }
    let lastEffective = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this);
      this._running++;
      return this.fn();
    } finally {
      postCleanEffect(this);
      this._running--;
      activeEffect = lastEffective;
    }
  }
};
function trackEffect(effect2, dep) {
  if (dep.get(effect2) !== effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    const oldDep = effect2.deps[effect2._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanEffect(dep, effect2);
      }
      effect2.deps[effect2._depsLength++] = dep;
    } else {
      effect2._depsLength++;
    }
  }
}
function triggerEffects(dep) {
  for (const effect2 of dep.keys()) {
    if (effect2._dirtyLevel < 4 /* Dirty */) {
      effect2._dirtyLevel = 4 /* Dirty */;
    }
    if (!effect2._running) {
      if (effect2.scheduler) {
        effect2.scheduler();
      }
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
  // 需要进行依赖收集
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, key);
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
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
function toReactive(val) {
  return isObject(val) ? reactive(val) : val;
}

// packages/reactivity/src/ref.ts
function ref(value) {
  return createRef(value);
}
function createRef(value) {
  return new RefImpl(value);
}
var RefImpl = class {
  // 用于收集对应的effect
  constructor(rawVal) {
    this.rawVal = rawVal;
    this.__v_isRef = true;
    this._value = toReactive(rawVal);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newVal) {
    if (newVal !== this.rawVal) {
      this.rawVal = newVal;
      triggerRefValue(this);
      this._value = toReactive(newVal);
    }
  }
};
function trackRefValue(refInstance) {
  if (activeEffect) {
    trackEffect(activeEffect, refInstance.dep = createDep(() => refInstance.dep = void 0, "undefined"));
  }
}
function triggerRefValue(refInstance) {
  const dep = refInstance.dep;
  if (dep) {
    triggerEffects(dep);
  }
}
var ObjectRefImpl = class {
  // 增加ref标识
  constructor(_obj, _key) {
    this._obj = _obj;
    this._key = _key;
    this.__v_isRef = true;
  }
  get value() {
    return this._obj[this._key];
  }
  set value(val) {
    this._obj[this._key] = val;
  }
};
function toRef(obj, key) {
  return new ObjectRefImpl(obj, key);
}
function toRefs(obj) {
  let res = {};
  Object.keys(obj).forEach((key) => {
    res[key] = toRef(obj, key);
  });
  return res;
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  // 这个存放dep
  constructor(getter, setter) {
    this.getter = getter;
    this.setter = setter;
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        triggerRefValue(this);
      }
    );
  }
  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run();
      trackRefValue(this);
    }
    return this._value;
  }
  set value(val) {
    this.setter(val);
  }
};
function computed(getterOrOptions) {
  const isOnlyeFunction = isFunction(getterOrOptions);
  let getter;
  let setter = () => {
  };
  if (isOnlyeFunction) {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
export {
  ReactiveEffect,
  activeEffect,
  computed,
  effect,
  reactive,
  ref,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  trackRefValue,
  triggerEffects,
  triggerRefValue
};
//# sourceMappingURL=reactivity.js.map
