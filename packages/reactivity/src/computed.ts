import { isFunction } from "@vue/shared/src";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

class ComputedRefImpl {
  public _value;
  public effect;
  public dep;   // 这个存放dep
  constructor(public getter, public setter) {
    
    this.effect = new ReactiveEffect(
      () => getter(this._value), 
      () => {
         // 计算属性依赖的值变化了，我们应该触发渲染effect重新执行
         triggerRefValue(this); // 依赖的属性变化后需要触发重新渲染，还需要将dirty变为true
      })
  }

  get value() {
    // get的时候走effect的run方法， run方法就是用户传入的getter函数
    // 第一次一定是脏的， 如果当前在effect中访问了计算属性，计算属性是可以收集这个effect的
    if (this.effect.dirty) {
      this._value = this.effect.run()
      // 收集依赖
      trackRefValue(this);
    }
    return this._value;
  }
  set value(val) {
    this.setter(val)
  }
}


export function computed(getterOrOptions) {
  const isOnlyeFunction = isFunction(getterOrOptions)

  let getter;
  let setter = () => {};

  if(isOnlyeFunction) {
    getter = getterOrOptions
  }else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}