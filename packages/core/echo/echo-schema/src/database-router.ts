//
// Copyright 2022 DXOS.org
//

import assert from 'node:assert';

import { Event } from '@dxos/async';
import { Item } from '@dxos/echo-db';
import { PublicKey } from '@dxos/keys';
import { log } from '@dxos/log';
import { ComplexMap } from '@dxos/util';

import { EchoDatabase, Selection, SubscriptionHandle } from './database';
import { base } from './defs';
import { EchoObject } from './object';
import { getCurrentReactComponent } from './react-integration';
import { EchoSchema } from './schema';

/**
 * Manages cross-space databases.
 */
export class DatabaseRouter {
  private readonly _accessObserverStack: AccessObserver[] = [];
  private readonly _databases = new ComplexMap<PublicKey, EchoDatabase>(PublicKey.hash);
  private readonly _update = new Event<{ spaceKey: PublicKey; changedEntities: Item<any>[] }>();

  private _schema?: EchoSchema;

  get schema(): EchoSchema | undefined {
    return this._schema;
  }

  setSchema(schema: EchoSchema) {
    assert(!this._schema);
    this._schema = schema;
  }

  register(spaceKey: PublicKey, database: EchoDatabase) {
    this._databases.set(spaceKey, database);
    database._updateEvent.on((entities) => this._update.emit({ spaceKey, changedEntities: entities }));
  }

  /**
   * Subscribe to database updates.
   */
  // TODO(burdon): Add filter?
  createSubscription(onUpdate: () => void): SubscriptionHandle {
    let subscribed = true;

    const unsubscribe = this._update.on(({ changedEntities }) => {
      subscribed = false;
      if (changedEntities.some((entity) => handle.selectedIds.has(entity.id))) {
        onUpdate();
      }
    });

    const handle = {
      update: (selection: Selection) => {
        handle.selectedIds = new Set(getIdsFromSelection(selection));
        return handle;
      },
      subscribed,
      selectedIds: new Set<string>(),
      unsubscribe
    };

    return handle;
  }

  createAccessObserver(): AccessObserver {
    const observer = new AccessObserver(() => {
      this._accessObserverStack.splice(this._accessObserverStack.indexOf(observer), 1);
    });
    this._accessObserverStack.push(observer);
    return observer;
  }

  /**
   * @internal
   */
  _logObjectAccess(obj: EchoObject) {
    this._accessObserverStack.at(-1)?.accessed.add(obj);

    // Print a helpful warning if we're accessing data in of a react component.
    if (this._accessObserverStack.length === 0) {
      const currentComponent = getCurrentReactComponent();
      if (currentComponent) {
        log.warn(
          `Warning: Data access in a React component without withReactor. Component will not update correctly.\n  at ${currentComponent.fileName}:${currentComponent.lineNumber}`
        );
      }
    }
  }
}

/**
 * Observes object access.
 */
export class AccessObserver {
  accessed: Set<EchoObject> = new Set();
  constructor(public pop: () => void) {}
}

const getIdsFromSelection = (selection: Selection): string[] => {
  if (selection instanceof EchoObject) {
    return [selection[base]._id];
  } else if (typeof selection === 'function') {
    return []; // TODO(burdon): Traverse function?
  } else if (!selection) {
    return [];
  } else {
    return selection.flatMap(getIdsFromSelection);
  }
};
