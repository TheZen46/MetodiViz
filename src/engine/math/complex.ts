export interface Complex {
  re: number;
  im: number;
}

export const C_ZERO: Complex = { re: 0, im: 0 };
export const C_ONE: Complex = { re: 1, im: 0 };
export const C_I: Complex = { re: 0, im: 1 };

export function c(re: number, im = 0): Complex {
  return { re, im };
}

export function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cNeg(a: Complex): Complex {
  return { re: -a.re, im: -a.im };
}

export function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function cDiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  if (denom === 0) {
    return { re: Number.NaN, im: Number.NaN };
  }
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom,
  };
}

export function cAbs(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

export function cArg(a: Complex): number {
  return Math.atan2(a.im, a.re);
}

export function cConj(a: Complex): Complex {
  return { re: a.re, im: -a.im };
}

export function cExp(z: Complex): Complex {
  const r = Math.exp(z.re);
  return { re: r * Math.cos(z.im), im: r * Math.sin(z.im) };
}

export function cLn(z: Complex): Complex {
  const r = cAbs(z);
  if (r === 0) return { re: Number.NEGATIVE_INFINITY, im: 0 };
  return { re: Math.log(r), im: cArg(z) };
}

export function cSqrt(z: Complex): Complex {
  const r = cAbs(z);
  if (r === 0) return C_ZERO;
  const re = Math.sqrt((r + z.re) / 2);
  const imSign = z.im < 0 ? -1 : 1;
  const im = imSign * Math.sqrt(Math.max(0, (r - z.re) / 2));
  return { re, im };
}

export function cPow(base: Complex, exp: Complex): Complex {
  if (exp.im === 0 && Number.isInteger(exp.re)) {
    const n = exp.re;
    if (n === 0) return C_ONE;
    if (n > 0 && n <= 12) {
      let acc = C_ONE;
      for (let i = 0; i < n; i++) acc = cMul(acc, base);
      return acc;
    }
    if (n < 0 && n >= -12) {
      let acc = C_ONE;
      for (let i = 0; i < -n; i++) acc = cMul(acc, base);
      return cDiv(C_ONE, acc);
    }
  }
  if (base.re === 0 && base.im === 0) {
    return exp.re > 0 ? C_ZERO : { re: Number.NaN, im: Number.NaN };
  }
  return cExp(cMul(exp, cLn(base)));
}

export function cSin(z: Complex): Complex {
  return {
    re: Math.sin(z.re) * Math.cosh(z.im),
    im: Math.cos(z.re) * Math.sinh(z.im),
  };
}

export function cCos(z: Complex): Complex {
  return {
    re: Math.cos(z.re) * Math.cosh(z.im),
    im: -Math.sin(z.re) * Math.sinh(z.im),
  };
}

export function cTan(z: Complex): Complex {
  return cDiv(cSin(z), cCos(z));
}

export function cSinh(z: Complex): Complex {
  return {
    re: Math.sinh(z.re) * Math.cos(z.im),
    im: Math.cosh(z.re) * Math.sin(z.im),
  };
}

export function cCosh(z: Complex): Complex {
  return {
    re: Math.cosh(z.re) * Math.cos(z.im),
    im: Math.sinh(z.re) * Math.sin(z.im),
  };
}

export function formatComplex(z: Complex, digits = 3): string {
  if (!Number.isFinite(z.re) || !Number.isFinite(z.im)) return 'NaN';
  const re = Math.abs(z.re) < 1e-9 ? 0 : z.re;
  const im = Math.abs(z.im) < 1e-9 ? 0 : z.im;
  const sign = im >= 0 ? '+' : '-';
  return `${re.toFixed(digits)} ${sign} ${Math.abs(im).toFixed(digits)}i`;
}
