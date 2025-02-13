//
// Copyright 2023 DXOS.org
//

import { type EditorView } from '@codemirror/view';
import React, { useMemo, useEffect } from 'react';

import { LayoutAction, parseFileManagerPlugin, useResolvePlugin, useIntentResolver } from '@dxos/app-framework';
import { useThemeContext, useTranslation, useRefCallback } from '@dxos/react-ui';
import {
  type Comment,
  type DNDOptions,
  type TextEditorProps,
  TextEditor,
  Toolbar,
  createBasicExtensions,
  createMarkdownExtensions,
  createThemeExtensions,
  dropFile,
  editorFillLayoutRoot,
  editorFillLayoutEditor,
  focusComment,
  useComments,
  useActionHandler,
  useFormattingState,
  processAction,
} from '@dxos/react-ui-editor';
import { attentionSurface, focusRing, mx, textBlockWidth } from '@dxos/react-ui-theme';
import { nonNullable } from '@dxos/util';

import { MARKDOWN_PLUGIN } from '../meta';

// Expose editor view for playwright tests.
// TODO(wittjosiah): Find a better way to expose this or find a way to limit it to test runs.
const useTest = (view: EditorView | null) => {
  useEffect(() => {
    const composer = (window as any).composer;
    if (composer) {
      composer.editorView = view;
    }
  }, [view]);
};

export type EditorMainProps = {
  id: string;
  readonly?: boolean;
  toolbar?: boolean;
  comments?: Comment[];
} & Pick<TextEditorProps, 'doc' | 'selection' | 'scrollTo' | 'extensions'>;

export const EditorMain = ({ id, readonly, toolbar, comments, extensions: _extensions, ...props }: EditorMainProps) => {
  const { t } = useTranslation(MARKDOWN_PLUGIN);
  const { themeMode } = useThemeContext();
  const fileManagerPlugin = useResolvePlugin(parseFileManagerPlugin);

  const { refCallback: editorRefCallback, value: editorView } = useRefCallback<EditorView>();

  useComments(editorView, id, comments);
  useTest(editorView);

  // Focus comment.
  useIntentResolver(MARKDOWN_PLUGIN, ({ action, data }) => {
    switch (action) {
      case LayoutAction.FOCUS: {
        const object = data?.object;
        if (editorView) {
          focusComment(editorView, object);
          return { data: true };
        }
        break;
      }
    }
  });

  // Toolbar actions.
  const handleAction = useActionHandler(editorView);
  const [formattingState, formattingObserver] = useFormattingState();

  const handleDrop: DNDOptions['onDrop'] = async (view, { files }) => {
    const info = await fileManagerPlugin?.provides.file.upload?.(files[0]);
    if (info) {
      processAction(view, { type: 'image', data: info.url });
    }
  };

  const extensions = useMemo(() => {
    return [
      _extensions,
      fileManagerPlugin && dropFile({ onDrop: handleDrop }),
      formattingObserver,
      createBasicExtensions({ readonly, placeholder: t('editor placeholder'), scrollPastEnd: true }),
      createMarkdownExtensions({ themeMode }),
      createThemeExtensions({
        themeMode,
        slots: {
          editor: { className: editorFillLayoutEditor },
          content: {
            // TODO(burdon): Overrides (!) are required since the built-in base theme sets padding and scrollPastEnd sets bottom.
            className: mx('!pli-2 sm:!pli-6 md:!pli-8 !pbs-2 sm:!pbs-6 md:!pbs-8'),
          },
        },
      }),
    ].filter(nonNullable);
  }, [_extensions, formattingObserver, readonly, themeMode]);

  return (
    <>
      {toolbar && (
        <Toolbar.Root
          classNames='max-is-[60rem] justify-self-center border-be separator-separator'
          state={formattingState}
          onAction={handleAction}
        >
          <Toolbar.Markdown />
          {fileManagerPlugin?.provides.file.upload && (
            <Toolbar.Custom
              onUpload={async (file) => {
                const info = await fileManagerPlugin.provides.file.upload!(file);
                return { url: info?.url };
              }}
            />
          )}
          <Toolbar.Separator />
          <Toolbar.Actions />
        </Toolbar.Root>
      )}
      <div
        role='none'
        data-toolbar={toolbar ? 'enabled' : 'disabled'}
        className='is-full bs-full overflow-hidden data-[toolbar=disabled]:pbs-2'
      >
        <TextEditor
          {...props}
          id={id}
          extensions={extensions}
          autoFocus
          moveToEndOfLine
          className={mx(
            focusRing,
            attentionSurface,
            textBlockWidth,
            editorFillLayoutRoot,
            'md:border-is md:border-ie separator-separator focus-visible:ring-inset',
            !toolbar && 'border-bs separator-separator',
          )}
          dataTestId='composer.markdownRoot'
          ref={editorRefCallback}
        />
      </div>
    </>
  );
};

export default EditorMain;
