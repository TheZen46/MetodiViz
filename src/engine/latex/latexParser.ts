export type ExprNode =
  | { type: 'number'; value: number }
  | { type: 'const'; name: 'pi' | 'e' | 'i' }
  | { type: 'var'; name: string }
  | { type: 'unary'; op: '-' | '+'; arg: ExprNode }
  | { type: 'binary'; op: '+' | '-' | '*' | '/' | '^'; left: ExprNode; right: ExprNode }
  | { type: 'call'; name: string; args: ExprNode[] }
  | { type: 'sum'; indexVar: string; start: ExprNode; end: ExprNode; body: ExprNode };

type BarTok = { kind: 'bar'; barType: 'open' | 'close' | 'neutral'; pos: number };
type CleanToken =
  | { kind: 'number'; value: number; pos: number }
  | { kind: 'ident'; value: string; pos: number }
  | { kind: 'cmd'; value: string; pos: number }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' | '^' | '='; pos: number }
  | { kind: 'lparen'; pos: number }
  | { kind: 'rparen'; pos: number }
  | { kind: 'lbrace'; pos: number }
  | { kind: 'rbrace'; pos: number }
  | { kind: 'lbracket'; pos: number }
  | { kind: 'rbracket'; pos: number }
  | BarTok
  | { kind: 'comma'; pos: number }
  | { kind: 'underscore'; pos: number }
  | { kind: 'eof'; pos: number };

const KNOWN_FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'arcsin',
  'arccos',
  'arctan',
  'asin',
  'acos',
  'atan',
  'sinh',
  'cosh',
  'tanh',
  'exp',
  'ln',
  'log',
  'sqrt',
  'abs',
  'sinc',
  're',
  'im',
  'arg',
  'conj',
  'floor',
  'ceil',
  'sign',
  'max',
  'min',
  'heaviside',
  'step',
  'mod',
]);

const GREEK_MAP: Record<string, string> = {
  pi: 'pi',
  theta: 'theta',
  varphi: 'phi',
  phi: 'phi',
  lambda: 'lambda',
  varepsilon: 'epsilon',
  epsilon: 'epsilon',
  alpha: 'alpha',
  beta: 'beta',
  gamma: 'gamma',
  delta: 'delta',
  omega: 'omega',
  tau: 'tau',
  sigma: 'sigma',
  exponentialE: 'e',
  imaginaryI: 'i',
};

function preprocessLatex(raw: string): string {
  let s = raw.trim();
  // Strip surrounding $...$ or $$...$$
  if (s.startsWith('$$') && s.endsWith('$$')) s = s.slice(2, -2);
  else if (s.startsWith('$') && s.endsWith('$')) s = s.slice(1, -1);

  // Strip spacing and sizing commands
  s = s
    .replace(/\\displaystyle/g, ' ')
    .replace(/\\limits/g, ' ')
    .replace(/\\nolimits/g, ' ')
    .replace(/\\,|\\;|\\:|\\!|\\quad|\\qquad/g, ' ')
    .replace(/\\placeholder\{\}/g, '')
    .replace(/\\mathrm\{e\}/g, ' e ')
    .replace(/\\mathrm\{i\}/g, ' i ')
    .replace(/\\operatorname\{([^}]+)\}/g, '\\$1');

  // Replace \left| and \right| with explicit markers
  s = s.replace(/\\left\s*\|/g, ' __LBAR__ ').replace(/\\right\s*\|/g, ' __RBAR__ ');
  s = s.replace(/\\left\s*([(\[{])/g, '$1').replace(/\\right\s*([)\]}])/g, '$1');
  s = s.replace(/\\left\s*\./g, ' ').replace(/\\right\s*\./g, ' ');
  s = s.replace(/\\lvert/g, ' __LBAR__ ').replace(/\\rvert/g, ' __RBAR__ ');

  // Normalize common LaTeX operator commands
  s = s
    .replace(/\\dfrac/g, '\\frac')
    .replace(/\\tfrac/g, '\\frac')
    .replace(/\\cdot/g, ' * ')
    .replace(/\\times/g, ' * ')
    .replace(/\\div/g, ' / ')
    .replace(/\\Re/g, '\\re')
    .replace(/\\Im/g, '\\im')
    .replace(/\\arg/g, '\\arg');

  return s;
}

function cleanTokenize(input: string): CleanToken[] {
  const s = preprocessLatex(input);
  const tokens: CleanToken[] = [];
  let i = 0;

  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (s.startsWith('__LBAR__', i)) {
      tokens.push({ kind: 'bar', barType: 'open', pos: i });
      i += 8;
      continue;
    }
    if (s.startsWith('__RBAR__', i)) {
      tokens.push({ kind: 'bar', barType: 'close', pos: i });
      i += 8;
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < s.length && /[0-9]/.test(s[i + 1]))) {
      const start = i;
      let hasDot = ch === '.';
      i++;
      while (i < s.length && (/[0-9]/.test(s[i]) || (!hasDot && s[i] === '.'))) {
        if (s[i] === '.') hasDot = true;
        i++;
      }
      tokens.push({ kind: 'number', value: Number(s.slice(start, i)), pos: start });
      continue;
    }
    if (ch === '\\') {
      const start = i;
      i++;
      if (i < s.length && !/[a-zA-Z]/.test(s[i])) {
        const sym = s[i];
        i++;
        if (sym === '|') tokens.push({ kind: 'bar', barType: 'neutral', pos: start });
        continue;
      }
      const cmdStart = i;
      while (i < s.length && /[a-zA-Z]/.test(s[i])) i++;
      tokens.push({ kind: 'cmd', value: s.slice(cmdStart, i), pos: start });
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      const start = i;
      while (i < s.length && /[a-zA-Z0-9]/.test(s[i])) i++;
      const word = s.slice(start, i);
      const lower = word.toLowerCase();
      if (KNOWN_FUNCTIONS.has(lower) || word === 'pi' || /^[a-zA-Z][0-9]+$/.test(word)) {
        tokens.push({ kind: 'ident', value: word, pos: start });
      } else {
        for (let k = 0; k < word.length; k++) {
          tokens.push({ kind: 'ident', value: word[k], pos: start + k });
        }
      }
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^' || ch === '=') {
      tokens.push({ kind: 'op', value: ch, pos: i });
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen', pos: i });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen', pos: i });
      i++;
      continue;
    }
    if (ch === '{') {
      tokens.push({ kind: 'lbrace', pos: i });
      i++;
      continue;
    }
    if (ch === '}') {
      tokens.push({ kind: 'rbrace', pos: i });
      i++;
      continue;
    }
    if (ch === '[') {
      tokens.push({ kind: 'lbracket', pos: i });
      i++;
      continue;
    }
    if (ch === ']') {
      tokens.push({ kind: 'rbracket', pos: i });
      i++;
      continue;
    }
    if (ch === '|') {
      tokens.push({ kind: 'bar', barType: 'neutral', pos: i });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ kind: 'comma', pos: i });
      i++;
      continue;
    }
    if (ch === '_') {
      tokens.push({ kind: 'underscore', pos: i });
      i++;
      continue;
    }
    throw new Error(`Carattere non riconosciuto '${ch}' alla posizione ${i + 1}`);
  }
  tokens.push({ kind: 'eof', pos: s.length });
  return tokens;
}

class Parser {
  private pos = 0;
  private barDepth = 0;

  constructor(private readonly tokens: CleanToken[]) {}

  private peek(offset = 0): CleanToken {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  private consume(): CleanToken {
    const t = this.peek();
    this.pos++;
    return t;
  }

  parse(): ExprNode {
    if (this.peek().kind === 'eof') {
      throw new Error('Espressione matematica vuota');
    }
    const expr = this.parseAddSub();
    if (this.peek().kind !== 'eof') {
      throw new Error(`Token inatteso vicino alla posizione ${this.peek().pos + 1}`);
    }
    return expr;
  }

  private parseAddSub(): ExprNode {
    let left = this.parseMulDiv();
    while (true) {
      const next = this.peek();
      if (next.kind === 'op' && (next.value === '+' || next.value === '-')) {
        this.consume();
        const right = this.parseMulDiv();
        left = { type: 'binary', op: next.value, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private canStartImplicitMul(tok: CleanToken): boolean {
    if (tok.kind === 'number' || tok.kind === 'ident' || tok.kind === 'lparen' || tok.kind === 'lbrace') {
      return true;
    }
    if (tok.kind === 'cmd') return true;
    if (tok.kind === 'bar') {
      if (tok.barType === 'close') return false;
      if (tok.barType === 'neutral' && this.barDepth > 0) return false;
      return true;
    }
    return false;
  }

  private parseMulDiv(): ExprNode {
    let left = this.parseUnary();
    while (true) {
      const next = this.peek();
      if (next.kind === 'op' && (next.value === '*' || next.value === '/')) {
        const op = (this.consume() as Extract<CleanToken, { kind: 'op' }>).value as '*' | '/';
        const right = this.parseUnary();
        left = { type: 'binary', op, left, right };
      } else if (this.canStartImplicitMul(next)) {
        const right = this.parseUnary();
        left = { type: 'binary', op: '*', left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parseUnary(): ExprNode {
    const next = this.peek();
    if (next.kind === 'op' && (next.value === '+' || next.value === '-')) {
      const op = (this.consume() as Extract<CleanToken, { kind: 'op' }>).value as '+' | '-';
      const arg = this.parseUnary();
      return op === '+' ? arg : { type: 'unary', op: '-', arg };
    }
    return this.parsePower();
  }

  private parsePower(): ExprNode {
    const base = this.parsePrimary();
    const next = this.peek();
    if (next.kind === 'op' && next.value === '^') {
      this.consume();
      const exp = this.parsePowerArg();
      return { type: 'binary', op: '^', left: base, right: exp };
    }
    return base;
  }

  private parsePowerArg(): ExprNode {
    const next = this.peek();
    if (next.kind === 'lbrace') {
      this.consume();
      const inside = this.parseAddSub();
      if (this.peek().kind !== 'rbrace') {
        throw new Error('Parentesi graffa chiusa } mancante nell’esponente');
      }
      this.consume();
      return inside;
    }
    if (next.kind === 'op' && next.value === '-') {
      this.consume();
      return { type: 'unary', op: '-', arg: this.parsePowerArg() };
    }
    return this.parsePrimary();
  }

  private parseGroupOrExpr(): ExprNode {
    const next = this.peek();
    if (next.kind === 'lbrace') {
      this.consume();
      const expr = this.parseAddSub();
      if (this.peek().kind !== 'rbrace') {
        throw new Error('Parentesi graffa chiusa } mancante');
      }
      this.consume();
      return expr;
    }
    if (next.kind === 'lparen') {
      this.consume();
      const expr = this.parseAddSub();
      if (this.peek().kind !== 'rparen') {
        throw new Error('Parentesi tonda chiusa ) mancante');
      }
      this.consume();
      return expr;
    }
    return this.parseUnary();
  }

  private parsePrimary(): ExprNode {
    const tok = this.peek();

    if (tok.kind === 'number') {
      this.consume();
      return { type: 'number', value: tok.value };
    }

    if (tok.kind === 'lparen') {
      this.consume();
      const expr = this.parseAddSub();
      if (this.peek().kind !== 'rparen') {
        throw new Error('Parentesi chiusa ) mancante');
      }
      this.consume();
      return expr;
    }

    if (tok.kind === 'lbrace') {
      this.consume();
      const expr = this.parseAddSub();
      if (this.peek().kind !== 'rbrace') {
        throw new Error('Parentesi graffa chiusa } mancante');
      }
      this.consume();
      return expr;
    }

    if (tok.kind === 'bar') {
      if (tok.barType === 'close' || (tok.barType === 'neutral' && this.barDepth > 0)) {
        throw new Error('Barra | di chiusura inattesa');
      }
      this.consume();
      this.barDepth++;
      const inner = this.parseAddSub();
      this.barDepth--;
      const closeTok = this.peek();
      if (
        closeTok.kind !== 'bar' ||
        (closeTok.barType !== 'close' && closeTok.barType !== 'neutral')
      ) {
        throw new Error('Barra di chiusura | mancante per valore assoluto/modulo');
      }
      this.consume();
      return { type: 'call', name: 'abs', args: [inner] };
    }

    if (tok.kind === 'cmd') {
      this.consume();
      const cmd = tok.value;

      if (cmd === 'frac') {
        const num = this.parseGroupOrExpr();
        const den = this.parseGroupOrExpr();
        return { type: 'binary', op: '/', left: num, right: den };
      }

      if (cmd === 'sqrt') {
        if (this.peek().kind === 'lbracket') {
          this.consume();
          const rootOrder = this.parseAddSub();
          if (this.peek().kind !== 'rbracket') {
            throw new Error('Parentesi ] mancante in \\sqrt[n]{...}');
          }
          this.consume();
          const arg = this.parseGroupOrExpr();
          return {
            type: 'binary',
            op: '^',
            left: arg,
            right: { type: 'binary', op: '/', left: { type: 'number', value: 1 }, right: rootOrder },
          };
        }
        const arg = this.parseGroupOrExpr();
        return { type: 'call', name: 'sqrt', args: [arg] };
      }

      if (cmd === 'sum') {
        return this.parseSum();
      }

      const lowerCmd = cmd.toLowerCase();
      if (GREEK_MAP[cmd] || GREEK_MAP[lowerCmd]) {
        const mapped = GREEK_MAP[cmd] ?? GREEK_MAP[lowerCmd];
        if (mapped === 'pi' || mapped === 'e' || mapped === 'i') {
          return { type: 'const', name: mapped };
        }
        return this.maybeWithSubscript(mapped);
      }

      if (KNOWN_FUNCTIONS.has(lowerCmd)) {
        return this.parseFunctionCall(lowerCmd);
      }

      throw new Error(`Comando LaTeX non supportato: \\${cmd}`);
    }

    if (tok.kind === 'ident') {
      this.consume();
      const lower = tok.value.toLowerCase();
      if (lower === 'pi') return { type: 'const', name: 'pi' };
      if (tok.value === 'e') return { type: 'const', name: 'e' };
      if (tok.value === 'i') return { type: 'const', name: 'i' };

      const afterIdent = this.peek();
      if (
        KNOWN_FUNCTIONS.has(lower) &&
        (afterIdent.kind === 'lparen' ||
          (afterIdent.kind === 'op' && afterIdent.value === '^'))
      ) {
        return this.parseFunctionCall(lower);
      }
      return this.maybeWithSubscript(tok.value);
    }

    throw new Error(`Espressione incompleta o non valida vicino alla posizione ${tok.pos + 1}`);
  }

  private maybeWithSubscript(baseName: string): ExprNode {
    if (this.peek().kind !== 'underscore') {
      return { type: 'var', name: baseName };
    }
    this.consume();
    if (this.peek().kind === 'lbrace') {
      this.consume();
      let sub = '';
      while (this.peek().kind !== 'rbrace' && this.peek().kind !== 'eof') {
        const t = this.consume();
        if (t.kind === 'ident') sub += t.value;
        else if (t.kind === 'number') sub += String(t.value);
        else throw new Error('Pedice non valido');
      }
      if (this.peek().kind !== 'rbrace') throw new Error('Parentesi graffa } mancante nel pedice');
      this.consume();
      return { type: 'var', name: `${baseName}_${sub}` };
    }
    const next = this.consume();
    if (next.kind === 'ident') return { type: 'var', name: `${baseName}_${next.value}` };
    if (next.kind === 'number') return { type: 'var', name: `${baseName}_${next.value}` };
    throw new Error('Pedice non valido');
  }

  private parseFunctionCall(fnName: string): ExprNode {
    let powerExp: ExprNode | null = null;
    const nextTok = this.peek();
    if (nextTok.kind === 'op' && nextTok.value === '^') {
      this.consume();
      powerExp = this.parsePowerArg();
    }

    const args: ExprNode[] = [];
    if (this.peek().kind === 'lparen') {
      this.consume();
      args.push(this.parseAddSub());
      while (this.peek().kind === 'comma') {
        this.consume();
        args.push(this.parseAddSub());
      }
      if (this.peek().kind !== 'rparen') {
        throw new Error(`Parentesi chiusa ) mancante negli argomenti di ${fnName}`);
      }
      this.consume();
    } else if (this.peek().kind === 'lbrace') {
      args.push(this.parseGroupOrExpr());
    } else {
      // Allow \sin x or \cos 2x without parens
      args.push(this.parsePower());
    }

    const callNode: ExprNode = { type: 'call', name: fnName, args };
    if (powerExp) {
      return { type: 'binary', op: '^', left: callNode, right: powerExp };
    }
    return callNode;
  }

  private parseSum(): ExprNode {
    if (this.peek().kind !== 'underscore') {
      throw new Error('Sintassi attesa per \\sum: \\sum_{k=1}^{N} ...');
    }
    this.consume();
    if (this.peek().kind !== 'lbrace') {
      throw new Error('Parentesi { mancante nel limite inferiore di \\sum');
    }
    this.consume();
    const indexTok = this.consume();
    if (indexTok.kind !== 'ident') {
      throw new Error('Indice di sommatoria non valido');
    }
    const eqTok = this.consume();
    if (eqTok.kind !== 'op' || eqTok.value !== '=') {
      throw new Error('Atteso = nel limite inferiore di \\sum');
    }
    const start = this.parseAddSub();
    if (this.peek().kind !== 'rbrace') {
      throw new Error('Parentesi } mancante nel limite inferiore di \\sum');
    }
    this.consume();

    const supTok = this.peek();
    if (supTok.kind !== 'op' || supTok.value !== '^') {
      throw new Error('Limite superiore ^ mancante in \\sum');
    }
    this.consume();
    const end = this.parsePowerArg();
    const body = this.parseMulDiv();
    return { type: 'sum', indexVar: indexTok.value, start, end, body };
  }
}

export function parseLatex(input: string): ExprNode {
  const tokens = cleanTokenize(input);
  return new Parser(tokens).parse();
}

export function tryParseLatex(input: string): { ast?: ExprNode; error?: string } {
  try {
    return { ast: parseLatex(input) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Errore di sintassi LaTeX' };
  }
}
