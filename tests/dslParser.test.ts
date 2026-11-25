import { describe, expect, it } from 'vitest';
import { parseDsl } from '../src/engine/dsl/dslParser';
import { serializeSceneToDsl } from '../src/engine/dsl/dslSerializer';
import { DSL_PRESETS } from '../src/engine/dsl/presets';

describe('MathScene DSL parser & serializer', () => {
  it('parses all built-in presets without errors', () => {
    for (const preset of DSL_PRESETS) {
      const res = parseDsl(preset.dsl);
      expect(res.errors, `Preset ${preset.id} had errors`).toEqual([]);
      expect(res.scene.view).toBe(preset.view);
    }
  });

  it('supports round-trip serialization', () => {
    const src = DSL_PRESETS[1].dsl;
    const p1 = parseDsl(src);
    expect(p1.errors).toEqual([]);
    const serialized = serializeSceneToDsl(p1.scene);
    const p2 = parseDsl(serialized);
    expect(p2.errors).toEqual([]);
    expect(p2.scene.objects.length).toBe(p1.scene.objects.length);
    expect(p2.scene.params.length).toBe(p1.scene.params.length);
  });

  it('reports line-numbered diagnostics on invalid syntax', () => {
    const res = parseDsl('view: 3d\ninvalidcommand foo');
    expect(res.errors.length).toBe(1);
    expect(res.errors[0].line).toBe(2);
  });
});
