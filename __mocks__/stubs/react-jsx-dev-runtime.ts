// React JSX dev runtime stub
export const Fragment = Symbol('Fragment');

export const jsxDEV = (type: any, props: any, key: any, isStaticChildren: any, source: any, self: any) => {
  return {
    $$typeof: Symbol('React.Element'),
    type,
    key,
    ref: null,
    props: props || {},
    _owner: null,
  };
};

export default {
  Fragment,
  jsxDEV,
};
