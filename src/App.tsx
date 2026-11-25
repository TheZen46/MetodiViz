import React, { useEffect, useState } from 'react';
import { BookOpen, FlaskConical, GraduationCap, Moon, Sun } from 'lucide-react';
import { parseDsl } from './engine/dsl/dslParser';
import { DSL_PRESETS } from './engine/dsl/presets';
import { SceneSpec } from './engine/dsl/types';
import { DslGuideModal } from './ui/DslGuideModal';
import { ProofStudio } from './ui/ProofStudio';
import { SandboxWorkspace } from './ui/SandboxWorkspace';

export const App: React.FC = () => {
  const [mode, setMode] = useState<'proofs' | 'sandbox'>('proofs');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [guideOpen, setGuideOpen] = useState(false);
  const [sandboxScene, setSandboxScene] = useState<SceneSpec>(() => parseDsl(DSL_PRESETS[0].dsl).scene);
  const [sandboxKey, setSandboxKey] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleOpenInSandbox = (scene: SceneSpec) => {
    setSandboxScene(structuredClone(scene));
    setMode('sandbox');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span>MetodiViz</span>
          <span className="brand-badge">Metodi Matematici · MVP</span>
        </div>

        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'proofs' ? 'active' : ''}`}
            onClick={() => setMode('proofs')}
          >
            <GraduationCap size={16} />
            Studio Dimostrazioni
          </button>
          <button
            className={`mode-tab ${mode === 'sandbox' ? 'active' : ''}`}
            onClick={() => setMode('sandbox')}
          >
            <FlaskConical size={16} />
            Sandbox & LaTeX
          </button>
        </div>

        <div className="topbar-actions">
          <button className="ghost-btn" onClick={() => setGuideOpen(true)}>
            <BookOpen size={15} />
            Guida DSL
          </button>
          <button
            className="icon-btn"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title="Cambia tema chiaro/scuro"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {mode === 'proofs' ? (
        <ProofStudio theme={theme} onOpenInSandbox={handleOpenInSandbox} />
      ) : (
        <SandboxWorkspace
          key={sandboxKey}
          theme={theme}
          scene={sandboxScene}
          onSceneChange={setSandboxScene}
          onOpenGuide={() => setGuideOpen(true)}
        />
      )}

      <DslGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onLoadExample={(dsl) => {
          const parsed = parseDsl(dsl);
          setSandboxScene(parsed.scene);
          setSandboxKey((k) => k + 1);
          setMode('sandbox');
        }}
      />
    </div>
  );
};

export default App;
