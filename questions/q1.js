const person = {
  name: 'qq',
  get ailasName() {
    return this.name + 'handsome'
  }
}

const proxyPerson = new Proxy(person, {
  get(target, p, receiver) {
    console.log(p,'123');
    
    // receiver指的就是proxyPerson, 这里死循环了
    // return receiver[p]
    // 这样就不会
    return Reflect.get(target, p)
  }
})

console.log(proxyPerson.ailasName);
