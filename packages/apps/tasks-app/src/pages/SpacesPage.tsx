//
// Copyright 2022 DXOS.org
//

import React, { useCallback } from 'react';

import { SpacesPage as BaseSpacesPage } from '@dxos/react-appkit';
import { Space } from '@dxos/react-client/echo';

import { TaskList } from '../proto';

export type SpacesPageProps = {};

export const SpacesPage = (props: SpacesPageProps) => {
  const createListItem = useCallback(async (space: Space) => {
    const list = new TaskList();
    await space.db.add(list);
  }, []);
  return <BaseSpacesPage onSpaceCreate={createListItem} />;
};
