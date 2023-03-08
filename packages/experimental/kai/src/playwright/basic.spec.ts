//
// Copyright 2023 DXOS.org
//

import { test } from '@playwright/test';
import { expect } from 'chai';
import waitForExpect from 'wait-for-expect';

import { AppManager } from './app-manager';

test.describe('Basic test', () => {
  let host: AppManager;
  let guest: AppManager;

  // TODO(wittjosiah): Currently not running in Firefox.
  //   https://bugzilla.mozilla.org/show_bug.cgi?id=1247687
  test.beforeAll(({ browser, browserName }) => {
    host = new AppManager(browser);
    // TODO(wittjosiah): WebRTC only available in chromium browser for testing currently.
    //   https://github.com/microsoft/playwright/issues/2973
    guest = browserName === 'chromium' ? new AppManager(browser) : host;
  });

  test.describe('Default space', () => {
    test('create identity', async () => {
      await host.init();

      expect(await host.kaiIsVisible()).to.be.false;

      await host.shell.createIdentity('host');

      // Wait for app to load identity.
      await waitForExpect(async () => {
        expect(await host.kaiIsVisible()).to.be.true;
      }, 1000);
    });

    test('invite guest', async ({ browserName }) => {
      if (browserName !== 'chromium') {
        return;
      }

      await guest.init();
      await guest.shell.createIdentity('guest');
      const invitationCode = await host.shell.createSpaceInvitation();
      await guest.openJoinSpace();
      const [authenticationCode] = await Promise.all([
        host.shell.getAuthenticationCode(),
        guest.shell.acceptSpaceInvitation(invitationCode)
      ]);
      await guest.shell.authenticate(authenticationCode);
      await host.shell.closeShell();

      // Wait for redirect.
      await waitForExpect(async () => {
        expect(await host.currentSpace()).to.equal(await guest.currentSpace());
      }, 1000);
    });
  });
});
