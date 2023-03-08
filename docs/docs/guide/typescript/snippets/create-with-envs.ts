//
// Copyright 2022 DXOS.org
//

import { Client, Config } from '@dxos/client';
import { Defaults, Dynamics, Envs } from '@dxos/config';

const client = new Client({
  config: new Config(await Dynamics(), await Envs(), Defaults())
});
