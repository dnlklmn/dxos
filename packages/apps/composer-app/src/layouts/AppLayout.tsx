//
// Copyright 2022 DXOS.org
//

import React from 'react';
import { Outlet } from 'react-router-dom';

import { Menubar2, Separator, ProfileMenu } from '@dxos/react-appkit';
import { useIdentity } from '@dxos/react-client';

import { Main } from '../components';

export const AppLayout = () => {
  const identity = useIdentity();
  return (
    <>
      <Menubar2>
        <Separator className='grow' />
        {identity && <ProfileMenu profile={identity} />}
      </Menubar2>
      <Main>
        <Outlet />
      </Main>
    </>
  );
};
