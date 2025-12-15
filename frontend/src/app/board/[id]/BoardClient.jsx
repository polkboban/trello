'use client';
import { useState, useEffect } from 'react';
import { DndContext, closestCorners, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { updateTaskPosition } from '@/actions/board';
import BoardColumn from '@/components/BoardColumn';
import TaskCard from '@/components/TaskCard';

const COLUMNS = ['todo', 'in_progress', 'review', 'done'];
const TITLES = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

export default function BoardClient({ initialTasks, projectId }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (e) => {
    setActiveTask(tasks.find(t => t.id === e.active.id));
  };

  const handleDragOver = (e) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const activeTask = tasks.find(t => t.id === activeId);
    const overTask = tasks.find(t => t.id === overId);

    if (!activeTask) return;

    if (COLUMNS.includes(overId)) {
      if (activeTask.status !== overId) {
        setTasks(prev => prev.map(t => 
          t.id === activeId ? { ...t, status: overId } : t
        ));
      }
      return;
    }

    if (overTask && activeTask !== overTask) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        const overIndex = prev.findIndex(t => t.id === overId);
        
        if (prev[activeIndex].status !== prev[overIndex].status) {
          prev[activeIndex].status = prev[overIndex].status;
        }
        
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  const handleDragEnd = async (e) => {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const currentTask = tasks.find(t => t.id === activeId);

    let newStatus = currentTask.status;
    if (COLUMNS.includes(overId)) newStatus = overId;
    else if (tasks.find(t => t.id === overId)) newStatus = tasks.find(t => t.id === overId).status;

   
    await updateTaskPosition(activeId, newStatus, new Date().getTime());
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full overflow-x-auto p-6 gap-6">
        {COLUMNS.map(colId => (
          <BoardColumn 
            key={colId} 
            id={colId} 
            title={TITLES[colId]} 
            tasks={tasks.filter(t => t.status === colId)} 
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}