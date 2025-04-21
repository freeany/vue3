import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";


// ref shallowRef
export function ref(value) {
  return createRef(value)
}

function createRef(value) {
  return new RefImpl(value)
}

// 只能通过属性访问器来增加属性的拦截操作
class RefImpl {
  private __v_isRef = true; // 增加ref标识
  private _value; // 保存ref的值
  public dep; // 用于收集对应的effect
  constructor(public rawVal) {
    this._value = toReactive(rawVal)
  }

  get value() {
    trackRefValue(this) // 收集到dep里 
    return this._value
  }
  set value(newVal) {
    if(newVal !== this.rawVal) {
      this.rawVal = newVal
      triggerRefValue(this)
      this._value = toReactive(newVal)
    }
  }
}


export function trackRefValue(refInstance) {
  if(activeEffect) {
    // 第二个参数没有意义
    trackEffect(activeEffect, refInstance.dep = createDep(() => (refInstance.dep = undefined), 'undefined'))
  }
}

export function triggerRefValue(refInstance) {
  const dep = refInstance.dep
  if (dep) {
    // 将key对应的所有effect执行
    triggerEffects(dep)
  }
}

// toRef, toRefs
class ObjectRefImpl {
  private __v_isRef = true; // 增加ref标识
  constructor(public _obj, public _key) {  }

  get value() {
    return this._obj[this._key]
  }
  set value(val) {
    this._obj[this._key] = val
  }
}

export function toRef(obj, key) {
  return new ObjectRefImpl(obj, key)
}


export function toRefs(obj) {
  let res = {}
  Object.keys(obj).forEach(key => {
    res[key] = toRef(obj, key) // 挨个属性调用toRef
  })

  return res
}