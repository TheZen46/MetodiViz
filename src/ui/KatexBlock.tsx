import React, { useMemo } from 'react';
import katex from 'katex';

interface KatexBlockProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const KatexBlock: React.FC<KatexBlockProps> = React.memo(
  ({ latex, displayMode = true, className }) => {
    const html = useMemo(() => {
      try {
        return katex.renderToString(latex, {
          displayMode,
          throwOnError: false,
          strict: false,
        });
      } catch {
        return '';
      }
    }, [latex, displayMode]);

    if (!html) {
      return <code className={className}>{latex}</code>;
    }

    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
);
