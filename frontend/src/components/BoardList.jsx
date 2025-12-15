'use client';
import { useState, useEffect } from 'react'; // Keep existing imports
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

// ... Keep SortableBoardCard component exactly as it is ...
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
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white dark:bg-[#2B2D33] h-36 rounded-2xl p-5 shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col justify-between overflow-hidden"
    >
      {/* DRAG HANDLE */}
      <button 
        type="button" 
        {...attributes} 
        {...listeners}
        className="absolute top-3 right-3 p-2 text-gray-400 hover:text-blue-500 cursor-grab active:cursor-grabbing z-20 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors touch-none"
        title="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>

      <Link href={`/board/${project.id}`} className="absolute inset-0 z-10" />
      
      <div>
        <div className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 mb-4"></div>
        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate pr-8">{project.name}</h3>
      </div>
      
      <div className="flex items-center justify-between mt-auto relative z-10 pointer-events-none">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Kanban Board</span>
        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-500">
           {project.name.charAt(0)}
        </div>
      </div>
    </div>
  );
}

// --- Main Grid Component ---
export default function BoardList({ initialProjects, workspaceId }) {
  const [projects, setProjects] = useState(initialProjects);
  const [activeId, setActiveId] = useState(null);
  const [isMounted, setIsMounted] = useState(false); // <--- 1. Add Mounted State

  useEffect(() => { 
    setProjects(initialProjects); 
    setIsMounted(true); // <--- 2. Set to true on client mount
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

  // 3. PREVENT SERVER RENDERING OF DND CONTEXT
  // If we are on the server (not mounted), we return null or a simple loading state
  // This prevents the mismatched IDs from breaking the app.
  if (!isMounted) {
    return null; 
  }

  return (
    <DndContext 
      id="board-dnd-context" // <--- 4. (Optional) Adding a stable ID also helps
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Create New Board Card */}
        <div className="h-36 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group relative">
          <form action={createProject} className="h-full w-full">
             <input type="hidden" name="workspaceId" value={workspaceId} />
             
             <input 
              name="name" 
              placeholder="Create new board..." 
              className="absolute inset-0 w-full h-full bg-transparent text-center text-transparent focus:text-gray-800 dark:focus:text-white placeholder-transparent focus:placeholder-gray-400 z-10 cursor-pointer focus:cursor-text outline-none text-lg font-medium p-6"
              required
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-focus-within:opacity-0 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                <Plus size={24} />
              </div>
              <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600 mt-2">New Board</span>
            </div>
          </form>
        </div>

        {/* Sortable List */}
        <SortableContext items={projects} strategy={rectSortingStrategy}>
          {projects.map((project) => (
            <SortableBoardCard key={project.id} project={project} />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeId && activeProject ? (
             <div className="bg-white dark:bg-[#2B2D33] h-36 rounded-2xl p-5 shadow-2xl border border-blue-500 scale-105 cursor-grabbing opacity-90 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-1 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 mb-4"></div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{activeProject.name}</h3>
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Moving...</span>
             </div>
          ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
}