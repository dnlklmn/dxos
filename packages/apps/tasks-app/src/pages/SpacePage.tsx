//
// Copyright 2022 DXOS.org
//

import React from 'react';
import { useOutletContext } from 'react-router-dom';

import type { Space } from '@dxos/client';
import { useQuery, observer } from '@dxos/react-client';
import { Loading } from '@dxos/react-components';

import { TaskList as TaskListComponent } from '../components/TaskList';
import { Task, TaskList } from '../proto';

/**
 * Lay out a single task list per space.
 * @returns JSX
 */
export const SpacePage = observer(() => {
  const { space } = useOutletContext<{ space: Space }>();
  const [taskList] = useQuery(space, TaskList.filter());
  if (!taskList) {
    return <Loading label='loading' />;
  }

  return (
    <TaskListComponent
      title={taskList.title}
      tasks={taskList.tasks?.filter((t) => !t.__deleted)}
      onTitleChanged={(title) => {
        taskList.title = title;
      }}
      onTaskCreate={() => {
        const task = new Task();
        taskList.tasks.push(task);
      }}
      onTaskTitleChanged={(task, title) => {
        task.title = title;
      }}
      onTaskCompleteChanged={(task, completed) => {
        task.completed = completed;
      }}
      onTaskDeleted={(task) => {
        void space.db.remove(task);
      }}
    />
  );
});
