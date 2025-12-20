'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus } from 'lucide-react';
import { updateProjectOrder, createProject } from '@/actions/project';

function SortableBoardCard({ project }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0 : 1, 
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative h-36 rounded-2xl p-5 flex flex-col justify-between overflow-hidden transition-all duration-300
                 bg-white/40 dark:bg-black/20 
                 backdrop-blur-xl backdrop-saturate-150
                 border border-white/50 dark:border-white/10
                 shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:bg-white/60 dark:hover:bg-black/30"
    >
      <button 
        type="button" 
        {...attributes} 
        {...listeners}
        className="absolute top-3 right-3 p-2 text-gray-500/70 hover:text-blue-500 cursor-grab active:cursor-grabbing z-20 
                   rounded-md transition-colors touch-none"
        title="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>

      <Link href={`/board/${project.id}`} className="absolute inset-0 z-10" />
      
      <div>
        <div className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-400/80 to-indigo-500/80 mb-4 backdrop-blur-sm"></div>
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate pr-8 drop-shadow-sm">{project.name}</h3>
      </div>
      
      <div className="flex items-center justify-between mt-auto relative z-10 pointer-events-none">
        <span className="text-xs font-semibold text-gray-500/80 dark:text-gray-400 uppercase tracking-wider">Kanban Board</span>
        <div className="w-6 h-6 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center text-[10px] text-gray-600 dark:text-gray-300 border border-white/20">
           {project.name.charAt(0)}
        </div>
      </div>
    </div>
  );
}

export default function BoardList({ initialProjects, workspaceId }) {
  const [projects, setProjects] = useState(initialProjects);
  const [activeId, setActiveId] = useState(null);
  const [isMounted, setIsMounted] = useState(false); 

  useEffect(() => { 
    setProjects(initialProjects); 
    setIsMounted(true); 
  }, [initialProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 8 } 
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (active && over && active.id !== over.id) {
      setProjects((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        const updates = newItems.map((item, index) => ({
          id: item.id,
          position: new Date().getTime() + (index * 1000) 
        }));
        
        updateProjectOrder(updates);
        return newItems;
      });
    }
  };

  const activeProject = projects.find(p => p.id === activeId);

  if (!isMounted) {
    return null; 
  }

  return (
    <DndContext 
      id="board-dnd-context" 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
        
        <div className="h-36 rounded-2xl transition-all group relative
                        bg-white/20 dark:bg-white/5 
                        backdrop-blur-sm border-2 border-dashed border-white/40 dark:border-white/10
                        hover:bg-white/30 dark:hover:bg-white/10 hover:border-blue-400/50 hover:shadow-lg">
          <form action={createProject} className="h-full w-full">
             <input type="hidden" name="workspaceId" value={workspaceId} />
             
             <input 
              name="name" 
              placeholder="Create new board..." 
              className="absolute inset-0 w-full h-full bg-transparent text-center text-transparent focus:text-gray-800 dark:focus:text-white placeholder-transparent focus:placeholder-gray-500/70 z-10 cursor-pointer focus:cursor-text outline-none text-lg font-medium p-6 transition-all"
              required
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-focus-within:opacity-0 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-white/40 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:text-blue-600 group-hover:scale-110 transition-all border border-white/20">
                <Plus size={24} />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 mt-2">New Board</span>
            </div>
          </form>
        </div>

        <SortableContext items={projects} strategy={rectSortingStrategy}>
          {projects.map((project) => (
            <SortableBoardCard key={project.id} project={project} />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeId && activeProject ? (
             <div className="h-36 rounded-2xl p-5 flex flex-col justify-between
                             bg-white/60 dark:bg-black/40 
                             backdrop-blur-2xl backdrop-saturate-200
                             border border-blue-400/50 dark:border-blue-500/50
                             scale-105 cursor-grabbing z-50">
                <div>
                  <div className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 mb-4 shadow-sm"></div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{activeProject.name}</h3>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Moving...</span>
             </div>
          ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
}