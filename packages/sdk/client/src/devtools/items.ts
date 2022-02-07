//
// Copyright 2020 DXOS.org
//

import { Stream } from '@dxos/codec-protobuf';

import { SubscribeToItemsResponse } from '../proto/gen/dxos/devtools';
import { DevtoolsServiceDependencies } from './devtools-context';

const getData = (echo: DevtoolsServiceDependencies['echo']): SubscribeToItemsResponse => {
  const result: any = {
    parties: []
  };

  const { value: parties } = echo.queryParties();
  for (const party of parties) {
    const partyInfo: any = {
      key: party.key.toHex(),
      items: []
    };

    const { result: items } = party.database.select().query();
    for (const item of items) {
      partyInfo.items.push({
        id: item.id,
        type: item.type,
        modelType: item.model._meta.type, // TODO(burdon): Private.
        modelName: Object.getPrototypeOf(item.model).constructor.name
      });
    }

    result.parties.push(partyInfo);
  }

  return {
    data: JSON.stringify(result)
  };
};

export const subscribeToItems = ({ echo }: DevtoolsServiceDependencies) => {
  return new Stream<SubscribeToItemsResponse>(({ next }) => {
    const update = () => {
      const res = getData(echo);
      next(res);
    };

    const partySubscriptions: Record<string, () => void> = {};
    const unsubscribe = echo.queryParties().subscribe((parties) => {
      parties.forEach(party => {
        if (!partySubscriptions[party.key.toHex()]) {
          const sub = party.database.select().query().update.on(() => {
            // Send updates on items changes.
            update();
          });
          partySubscriptions[party.key.toHex()] = sub;
        }
      });

      // Send items for new parties.
      update();
    });

    // Send initial items.
    update();

    return () => {
      unsubscribe();
      Object.values(partySubscriptions).forEach(unsubscribe => unsubscribe());
    };
  });
};
