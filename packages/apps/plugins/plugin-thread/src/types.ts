//
// Copyright 2023 DXOS.org
//

import { type MarkdownExtensionProvides } from '@braneframe/plugin-markdown';
import { Thread as ThreadType } from '@braneframe/types';
import type {
  GraphBuilderProvides,
  IntentResolverProvides,
  MetadataRecordsProvides,
  SettingsProvides,
  SurfaceProvides,
  TranslationsProvides,
} from '@dxos/app-framework';
import { isTypedObject } from '@dxos/react-client/echo';

import { THREAD_PLUGIN } from './meta';

const THREAD_ACTION = `${THREAD_PLUGIN}/action`;
export enum ThreadAction {
  CREATE = `${THREAD_ACTION}/create`,
  SELECT = `${THREAD_ACTION}/select`,
  DELETE = `${THREAD_ACTION}/delete`,
}

export type ThreadPluginProvides = SurfaceProvides &
  IntentResolverProvides &
  GraphBuilderProvides &
  MetadataRecordsProvides &
  SettingsProvides &
  TranslationsProvides &
  MarkdownExtensionProvides;

export type ThreadSettingsProps = { standalone?: boolean };

export interface ThreadModel {
  root: ThreadType;
}

export const isThread = (data: unknown): data is ThreadType => {
  return isTypedObject(data) && ThreadType.schema.typename === data.__typename;
};
