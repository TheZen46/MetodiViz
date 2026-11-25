import { ExprNode } from '../latex/latexParser';
import {
  Complex,
  C_I,
  c,
  cAbs,
  cAdd,
  cArg,
  cConj,
  cCos,
  cCosh,
  cDiv,
  cExp,
  cLn,
  cMul,
  cNeg,
  cPow,
  cSin,
  cSinh,
  cSqrt,
  cSub,
  cTan,
} from './complex';

function lookupReal(scope: Record<string, number>, name: string): number {
  if (Object.prototype.hasOwnProperty.call(scope, name)) return scope[name];
  if (name.includes('_')) {
    const flat = name.replace(/_/g, '');
    if (Object.prototype.hasOwnProperty.call(scope, flat)) return scope[flat];
  }
  return Number.NaN;
}

function lookupComplex(scope: Record<string, Complex>, name: string): Complex {
  if (Object.prototype.hasOwnProperty.call(scope, name)) return scope[name];
  if (name.includes('_')) {
    const flat = name.replace(/_/g, '');
    if (Object.prototype.hasOwnProperty.call(scope, flat)) return scope[flat];
  }
  return { re: Number.NaN, im: Number.NaN };
}

export function evalReal(node: ExprNode, scope: Record<string, number>): number {
  switch (node.type) {
    case 'number':
      return node.value;
    case 'const':
      if (node.name === 'pi') return Math.PI;
      if (node.name === 'e') return Math.E;
      return Number.NaN;
    case 'var':
      return lookupReal(scope, node.name);
    case 'unary': {
      const v = evalReal(node.arg, scope);
      return node.op === '-' ? -v : v;
    }
    case 'binary': {
      const l = evalReal(node.left, scope);
      const r = evalReal(node.right, scope);
      switch (node.op) {
        case '+':
          return l + r;
        case '-':
          return l - r;
        case '*':
          return l * r;
        case '/':
          return l / r;
        case '^':
          return Math.pow(l, r);
      }
    }
    case 'sum': {
      const start = Math.round(evalReal(node.start, scope));
      const end = Math.round(evalReal(node.end, scope));
      if (!Number.isFinite(start) || !Number.isFinite(end)) return Number.NaN;
      const limit = Math.min(end, start + 500);
      let total = 0;
      const innerScope = { ...scope };
      for (let k = start; k <= limit; k++) {
        innerScope[node.indexVar] = k;
        total += evalReal(node.body, innerScope);
      }
      return total;
    }
    case 'call': {
      const args = node.args.map((a) => evalReal(a, scope));
      const x = args[0] ?? 0;
      switch (node.name) {
        case 'sin':
          return Math.sin(x);
        case 'cos':
          return Math.cos(x);
        case 'tan':
          return Math.tan(x);
        case 'arcsin':
        case 'asin':
          return Math.asin(x);
        case 'arccos':
        case 'acos':
          return Math.acos(x);
        case 'arctan':
        case 'atan':
          return Math.atan(x);
        case 'sinh':
          return Math.sinh(x);
        case 'cosh':
          return Math.cosh(x);
        case 'tanh':
          return Math.tanh(x);
        case 'exp':
          return Math.exp(x);
        case 'ln':
        case 'log':
          return Math.log(x);
        case 'sqrt':
          return Math.sqrt(x);
        case 'abs':
          return Math.abs(x);
        case 'sinc':
          return Math.abs(x) < 1e-7 ? 1 - (x * x) / 6 : Math.sin(x) / x;
        case 'floor':
          return Math.floor(x);
        case 'ceil':
          return Math.ceil(x);
        case 'sign':
          return Math.sign(x);
        case 'heaviside':
        case 'step':
          return x > 0 ? 1 : x < 0 ? 0 : 0.5;
        case 'max':
          return Math.max(...args);
        case 'min':
          return Math.min(...args);
        case 'mod':
          return args.length >= 2 ? ((args[0] % args[1]) + args[1]) % args[1] : Number.NaN;
        case 're':
          return x;
        case 'im':
          return 0;
        case 'arg':
          return x >= 0 ? 0 : Math.PI;
        case 'conj':
          return x;
        default:
          return Number.NaN;
      }
    }
  }
}

export function evalComplex(node: ExprNode, scope: Record<string, Complex>): Complex {
  switch (node.type) {
    case 'number':
      return c(node.value, 0);
    case 'const':
      if (node.name === 'pi') return c(Math.PI, 0);
      if (node.name === 'e') return c(Math.E, 0);
      return C_I;
    case 'var':
      return lookupComplex(scope, node.name);
    case 'unary': {
      const v = evalComplex(node.arg, scope);
      return node.op === '-' ? cNeg(v) : v;
    }
    case 'binary': {
      const l = evalComplex(node.left, scope);
      const r = evalComplex(node.right, scope);
      switch (node.op) {
        case '+':
          return cAdd(l, r);
        case '-':
          return cSub(l, r);
        case '*':
          return cMul(l, r);
        case '/':
          return cDiv(l, r);
        case '^':
          return cPow(l, r);
      }
    }
    case 'sum': {
      const start = Math.round(evalComplex(node.start, scope).re);
      const end = Math.round(evalComplex(node.end, scope).re);
      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return { re: Number.NaN, im: Number.NaN };
      }
      const limit = Math.min(end, start + 500);
      let acc = c(0, 0);
      const innerScope = { ...scope };
      for (let k = start; k <= limit; k++) {
        innerScope[node.indexVar] = c(k, 0);
        acc = cAdd(acc, evalComplex(node.body, innerScope));
      }
      return acc;
    }
    case 'call': {
      const z = node.args[0] ? evalComplex(node.args[0], scope) : c(0, 0);
      switch (node.name) {
        case 'sin':
          return cSin(z);
        case 'cos':
          return cCos(z);
        case 'tan':
          return cTan(z);
        case 'sinh':
          return cSinh(z);
        case 'cosh':
          return cCosh(z);
        case 'exp':
          return cExp(z);
        case 'ln':
        case 'log':
          return cLn(z);
        case 'sqrt':
          return cSqrt(z);
        case 'abs':
          return c(cAbs(z), 0);
        case 're':
          return c(z.re, 0);
        case 'im':
          return c(z.im, 0);
        case 'arg':
          return c(cArg(z), 0);
        case 'conj':
          return cConj(z);
        case 'sinc': {
          if (cAbs(z) < 1e-7) return c(1, 0);
          return cDiv(cSin(z), z);
        }
        default:
          return { re: Number.NaN, im: Number.NaN };
      }
    }
  }
}
