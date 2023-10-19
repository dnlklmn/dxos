//
// Copyright 2023 DXOS.org
//

import React, { type HTMLAttributes, useRef } from 'react';

import { type ComposerModel, MarkdownComposer, type MarkdownComposerRef } from '@dxos/react-ui-composer';
import { focusRing, mx } from '@dxos/react-ui-theme';

import { type MarkdownProperties } from '../types';

export const EditorSection = ({
  data: { content: document },
}: {
  data: { content: MarkdownProperties & ComposerModel };
}) => {
  const editorRef = useRef<MarkdownComposerRef>(null);
  const model: ComposerModel = {
    id: document.id,
    content: document.content,
  };

  return (
    <MarkdownComposer
      ref={editorRef}
      model={model}
      slots={{
        root: {
          role: 'none',
          className: mx(focusRing, 'min-bs-[10rem] shrink-0 grow flex flex-col'),
          'data-testid': 'composer.markdownRoot',
        } as HTMLAttributes<HTMLDivElement>,
        editor: {
          markdownTheme: {
            '&, & .cm-scroller': {
              display: 'flex',
              flexDirection: 'column',
              flex: '1 0 auto',
              inlineSize: '100%',
            },
            '& .cm-content': { flex: '1 0 auto', inlineSize: '100%', paddingBlock: '1rem' },
            '& .cm-line': { paddingInline: '0' },
          },
        },
      }}
    />
  );
};
