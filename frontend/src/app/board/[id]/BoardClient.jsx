'use client';
import { useState, useEffect } from 'react';
import { DndContext, closestCorners, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { updateTaskPosition } from '@/actions/board';
import BoardColumn from '@/components/BoardColumn';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { useSocket } from '@/hooks/useSocket'; 

const COLUMNS = ['todo', 'in_progress', 'review', 'done'];
const TITLES = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };

export default function BoardClient({ initialTasks, projectId }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeDragTask, setActiveDragTask] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);

  // --- 1. Initialize Socket Connection ---
  const socket = useSocket(projectId);

  // --- 2. Listen for Real-Time Updates ---
  useEffect(() => {
    if (!socket) return;

    const onTaskMoved = (data) => {
      // Optimistic update for moves from other users
      setTasks(prev => prev.map(t => 
        t.id === data.taskId ? { ...t, status: data.newStatus } : t
      ));
    };

    const onTaskCreated = (newTask) => {
      setTasks(prev => [...prev, newTask]);
    };

    const onTaskUpdated = (updatedTask) => {
      setTasks(prev => prev.map(t => 
        t.id === updatedTask.id ? updatedTask : t
      ));
    };

    const onTaskDeleted = ({ taskId }) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    socket.on('task_moved', onTaskMoved);
    socket.on('task_created', onTaskCreated);
    socket.on('task_updated', onTaskUpdated);
    socket.on('task_deleted', onTaskDeleted);

    return () => {
      socket.off('task_moved', onTaskMoved);
      socket.off('task_created', onTaskCreated);
      socket.off('task_updated', onTaskUpdated);
      socket.off('task_deleted', onTaskDeleted);
    };
  }, [socket]);

  // Sync with server data if page revalidates
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // --- Handlers ---

  const openNewTaskModal = (columnId) => {
    setSelectedColumn(columnId);
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setSelectedTask(task);
    setSelectedColumn(task.status);
    setIsModalOpen(true);
  };

  const handleDragStart = (e) => {
    setActiveDragTask(tasks.find(t => t.id === e.active.id));
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
        setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: overId } : t));
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
    setActiveDragTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const currentTask = tasks.find(t => t.id === activeId);
    
    // Calculate new status
    let newStatus = currentTask.status;
    if (COLUMNS.includes(overId)) newStatus = overId;
    else if (tasks.find(t => t.id === overId)) newStatus = tasks.find(t => t.id === overId).status;

    // 1. Emit Socket Event (Realtime broadcast)
    if (socket) {
      socket.emit('task_moved', {
        taskId: activeId,
        newStatus: newStatus,
        projectId: projectId,
      });
    }

    // 2. Persist to Database (Server Action)
    await updateTaskPosition(activeId, newStatus, new Date().getTime());
  };

  return (
    <>
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
              onAddTask={() => openNewTaskModal(colId)}
              onTaskClick={openEditTaskModal}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDragTask ? <TaskCard task={activeDragTask} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        columnId={selectedColumn}
        projectId={projectId}
        socket={socket} 
      />
    </>
  );
}