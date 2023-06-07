//
// Copyright 2022 DXOS.org
//

import React, { PropsWithChildren } from 'react';

import {
  ThemeProvider as AuroraThemeProvider,
  ThemeProviderProps as AuroraThemeProviderProps,
  Toast,
  Tooltip,
  TooltipProviderProps,
  ToastProviderProps,
  ToastViewportProps,
} from '@dxos/aurora';
import { osTx, appTx } from '@dxos/aurora-theme';

export type ThemeProviderProps = AuroraThemeProviderProps &
  PropsWithChildren<{
    themeVariant?: 'app' | 'os';
    tooltipProviderProps?: Omit<TooltipProviderProps, 'children'>;
    toastProviderProps?: Omit<ToastProviderProps, 'children'>;
    toastViewportProps?: Omit<ToastViewportProps, 'children'>;
  }>;

export const ThemeProvider = ({
  children,
  themeVariant,
  tooltipProviderProps,
  toastProviderProps,
  toastViewportProps,
  ...auroraThemeProviderProps
}: ThemeProviderProps) => {
  return (
    <AuroraThemeProvider tx={themeVariant === 'os' ? osTx : appTx} {...auroraThemeProviderProps}>
      <Toast.Provider {...toastProviderProps}>
        <Tooltip.Provider delayDuration={100} skipDelayDuration={400} {...tooltipProviderProps}>
          {children}
        </Tooltip.Provider>
        <Toast.Viewport {...toastViewportProps} classNames={toastViewportProps?.classNames} />
      </Toast.Provider>
    </AuroraThemeProvider>
  );
};
