export class Accessor{
    constructor(public target: MVCObject, public targetKey: string){};
  }
  
  let getterNameCache = {};
  let setterNameCache = {};
  let ooid = 0;
  let bindings = '__o_bindings';
  let accessors = '__o_accessors';
  let oid = '__o_oid';
  
  function capitalize(str: string) {
    return str.substr(0, 1).toUpperCase() + str.substr(1);
  }
  
  function getOid(obj: MVCObject) {
    return obj[oid] || (obj[oid] = ++ooid);
  }
  
  function toKey(key: string) {
    return '_' + key;
  }
  
  function getGetterName(key: string) {
    if (getterNameCache.hasOwnProperty(key)) {
      return getterNameCache[key];
    } else {
      return getterNameCache[key] = 'get' + capitalize(key);
    }
  }
  
  function getSetterName(key: string) {
    if (setterNameCache.hasOwnProperty(key)) {
      return setterNameCache[key];
    } else {
      return setterNameCache[key] = 'set' + capitalize(key);
    }
  }
  

  function triggerChange(target: MVCObject, targetKey: string) {
    var evt = targetKey + '_changed';

    if (target[evt]) {
      target[evt]();
    } else if (typeof target.changed === 'function') {
      target.changed(targetKey);
    }
  
    if (target[bindings] && target[bindings][targetKey]) {
      var ref = target[bindings][targetKey];
      var bindingObj, bindingUid;
      for (bindingUid in ref) {
        if (ref.hasOwnProperty(bindingUid)) {
          bindingObj = ref[bindingUid];
          triggerChange(bindingObj.target, bindingObj.targetKey);
        }
      }
    }
  }
  
  export class MVCObject{
  
    get<T>(key: string): T{
      var self = this;
      if (self[accessors] && self[accessors].hasOwnProperty(key)) {
        var accessor = self[accessors][key];
        var targetKey = accessor.targetKey;
        var target = accessor.target;
        var getterName = getGetterName(targetKey);
        var value;
        if (target[getterName]) {
          value = target[getterName]();
        } else {
          value = target.get(targetKey);
        }
      } else if (self.hasOwnProperty(toKey(key))) {
        value = self[toKey(key)];
      }
      return value;
    }

    set(key: string, value?: any): MVCObject{
      var self = this;
      if (self[accessors] && self[accessors].hasOwnProperty(key)) {
        var accessor = self[accessors][key];
        var targetKey = accessor.targetKey;
        var target = accessor.target;
        var setterName = getSetterName(targetKey);
        if (target[setterName]) {
          target[setterName](value);
        } else {
          target.set(targetKey, value);
        }
      } else {
        this[toKey(key)] = value;
        triggerChange(self, key);
      }
      return self;
    }
  
    changed(...args: any[]): any{}
    notify(key: string): MVCObject{
      var self = this;
      if (self[accessors] && self[accessors].hasOwnProperty(key)) {
        var accessor = self[accessors][key];
        var targetKey = accessor.targetKey;
        var target = accessor.target;
        target.notify(targetKey);
      } else {
        triggerChange(self, key);
      }
      return self;
    }
  
    setValues(values): MVCObject{
      var self = this;
      var key, setterName, value;
      for (key in values) {
        if (values.hasOwnProperty(key)) {
          value = values[key];
          setterName = getSetterName(key);
          if (self[setterName]) {
            self[setterName](value);
          } else {
            self.set(key, value);
          }
        }
      }
      return self;
    }

    bindTo(key: string, target: MVCObject, targetKey: string = key, noNotify?: boolean): MVCObject{
      var self = this;
      self.unbind(key);
  
      self[accessors] || (self[accessors] = {});
      target[bindings] || (target[bindings] = {});
      target[bindings][targetKey] || (target[bindings][targetKey] = {});
  
      var binding = new Accessor(self, key);
      var accessor = new Accessor(target, targetKey);
  
      self[accessors][key] = accessor;
      target[bindings][targetKey][getOid(self)] = binding;
  
      if (!noNotify) {
        triggerChange(self, key);
      }
  
      return self;
    }
  
    unbind(key: string): MVCObject{
      var self = this;
      if (self[accessors]) {
        var accessor = self[accessors][key];
        if (accessor) {
          var target = accessor.target;
          var targetKey = accessor.targetKey;
          self[toKey(key)] = self.get(key);
          delete target[bindings][targetKey][getOid(self)];
          delete self[accessors][key];
        }
      }
      return self;
    }
  
    unbindAll(): MVCObject{
      var self = this;
      if (self[accessors]) {
        var ref = self[accessors];
        for (var key in ref) {
          if (ref.hasOwnProperty(key)) {
            self.unbind(key);
          }
        }
      }
      return self;
    }
  }
  
  export default MVCObject;