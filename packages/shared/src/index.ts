export function isObject(val: unknown) {
  return typeof val === 'object' ? true : null
}

export function isFunction(val: unknown) {
  return typeof val === 'function' ? true : false
}