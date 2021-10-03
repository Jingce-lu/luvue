# v-if，v-model，v-for 的实现原理

[[toc]]

## v-for 实现原理

> src/compiler/codegen/index.js:187

```js
export function genFor(
  el: any,
  state: CodegenState,
  altGen?: Function,
  altHelper?: string
): string {
  const exp = el.for; // 拿到表达式arr
  const alias = el.alias;
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : '';
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : '';

  if (
    process.env.NODE_ENV !== 'production' &&
    state.maybeComponent(el) && // slot 和 template不能进行v-for操作
    el.tag !== 'slot' &&
    el.tag !== 'template' &&
    !el.key
  ) {
    state.warn(
      `<${el.tag} v-for="${alias} in ${exp}">: component lists rendered with ` +
        `v-for should have explicit keys. ` +
        `See https://vuejs.org/guide/list.html#key for more info.`,
      el.rawAttrsMap['v-for'],
      true /* tip */
    );
  }
  el.forProcessed = true; // avoid recursion 生成循环函数
  const r =
    `${altHelper || '_l'}((${exp}),` +
    `function(${alias}${iterator1}${iterator2}){` +
    `return ${(altGen || genElement)(el, state)}` +
    '})';

  return r;
}
```

## v-if 实现原理

> src/compiler/codegen/index.js:147

```js
function genIfConditions(
  conditions: ASTIfConditions,
  state: CodegenState,
  altGen?: Function,
  altEmpty?: string
): string {
  if (!conditions.length) {
    return altEmpty || '_e()';
  }
  const condition = conditions.shift();
  if (condition.exp) {
    // 如果有表达式
    return `(${condition.exp})?${
      // 将表达式拼接起来
      genTernaryExp(condition.block)
    }:${
      // v-else-if
      genIfConditions(conditions, state, altGen, altEmpty)
    }`;
  } else {
    return `${genTernaryExp(condition.block)}`; // 没有表达式直接生成元素 像v-else
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp(el) {
    return altGen
      ? altGen(el, state)
      : el.once
      ? genOnce(el, state)
      : genElement(el, state);
  }
}
```

## v-model 实现原理

### 普通元素上的 v-model 指令

> src/compiler/codegen/index.js:310

```js
function genDirectives(el: ASTElement, state: CodegenState): string | void {
  const dirs = el.directives; // 获取所有指令
  if (!dirs) return;
  let res = 'directives:[';
  let hasRuntime = false;
  let i, l, dir, needRuntime;
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i];
    needRuntime = true;
    const gen: DirectiveFunction = state.directives[dir.name];
    if (gen) {
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      needRuntime = !!gen(el, dir, state.warn); // 添加input事件 和 value属性
    }
    if (needRuntime) {
      hasRuntime = true; // 是否需要运行时
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${
        dir.value
          ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}`
          : ''
      }${dir.arg ? `,arg:${dir.isDynamicArg ? dir.arg : `"${dir.arg}"`}` : ''}${
        dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
      }},`;
    }
  }
  if (hasRuntime) {
    // directives:[{name:"model",rawName:"v-model",value:(msg),expression:"msg"}] 生成对应指令
    let result = res.slice(0, -1) + ']';
    return result;
  }
}
```

### 组件上的 v-model 指令

<div align="center"><img :src="$withBase('/images/vuebase/component-model.png')" alt="vuebase/component-model.png"></div>

```js
function transformModel(options, data: any) {
  const prop = (options.model && options.model.prop) || 'value'; // 默认采用value属性
  const event = (options.model && options.model.event) || 'input'; // 默认采用input事件
  (data.attrs || (data.attrs = {}))[prop] = data.model.value; // 绑定属性
  const on = data.on || (data.on = {}); // 绑定事件
  const existing = on[event];
  const callback = data.model.callback;
  if (isDef(existing)) {
    if (
      Array.isArray(existing)
        ? existing.indexOf(callback) === -1
        : existing !== callback
    ) {
      on[event] = [callback].concat(existing);
    }
  } else {
    on[event] = callback;
  }
}
```
