import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
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
    setSandboxKey((k) => k + 1);
    setMode('sandbox');
  };

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Vai al contenuto principale
      </a>

      <header className="topbar">
        <div className="brand-group">
          <h1 className="brand-title">MetodiViz</h1>
          <span className="brand-subtitle">Metodi Matematici</span>
        </div>

        <nav className="mode-nav" aria-label="Modalità principali">
          <button
            type="button"
            className="mode-tab"
            aria-pressed={mode === 'proofs'}
            onClick={() => setMode('proofs')}
          >
            Studio Dimostrazioni
          </button>
          <button
            type="button"
            className="mode-tab"
            aria-pressed={mode === 'sandbox'}
            onClick={() => setMode('sandbox')}
          >
            Sandbox e LaTeX
          </button>
        </nav>

        <div className="topbar-actions">
          <button type="button" className="ghost-btn" onClick={() => setGuideOpen(true)}>
            Guida DSL
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            title={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
          >
            {theme === 'dark' ? (
              <Sun size={16} aria-hidden="true" />
            ) : (
              <Moon size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <main id="main-content" className="workspace-main">
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
      </main>

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
