//
// Copyright 2023 DXOS.org
//

import React from 'react';

import { AlertDialog, AlertDialogContentProps, useId } from '@dxos/aurora';

import { JoinPanel, JoinPanelProps } from '../../panels';
import { defaultSurface } from '../../styles';

export interface JoinDialogProps
  extends Omit<AlertDialogContentProps, 'children'>,
    Omit<JoinPanelProps, 'exitActionParent' | 'doneActionParent'> {}

export const JoinDialog = (joinPanelProps: JoinDialogProps) => {
  const titleId = useId('joinDialog__title');

  return (
    <AlertDialog.Root defaultOpen>
      <AlertDialog.Portal>
        <AlertDialog.Overlay>
          <AlertDialog.Content aria-labelledby={titleId} classNames={defaultSurface}>
            <JoinPanel
              {...{
                ...joinPanelProps,
                titleId,
                exitActionParent: <AlertDialog.Cancel asChild />,
                doneActionParent: <AlertDialog.Action asChild />,
              }}
            />
          </AlertDialog.Content>
        </AlertDialog.Overlay>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
