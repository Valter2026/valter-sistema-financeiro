'use client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface Props {
  id: string
  children: React.ReactNode
}

export function SortableWidget({ id, children }: Props) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 'auto',
      }}
      className="relative group"
    >
      {/* Drag handle — aparece ao hover no desktop, sempre visível no mobile */}
      <div
        {...attributes}
        {...listeners}
        title="Arraste para reorganizar"
        className="absolute top-2 right-2 z-20 p-1.5 rounded-lg cursor-grab active:cursor-grabbing
          text-gray-600 hover:text-gray-400 hover:bg-gray-800
          md:opacity-0 md:group-hover:opacity-100 opacity-40
          transition-all touch-none select-none"
      >
        <GripVertical size={13} />
      </div>
      {children}
    </div>
  )
}
