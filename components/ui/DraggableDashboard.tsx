'use client'
import { useState, useEffect } from 'react'
import {
  DndContext, closestCenter,
  PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable'
import { SortableWidget } from './SortableWidget'

export interface DashWidget {
  id: string
  content: React.ReactNode
  /** Se false, o widget não é renderizado (ex: seção condicional sem dados) */
  visible?: boolean
}

interface Props {
  storageKey: string
  widgets: DashWidget[]
  /** Seção fixa no topo — não é sortável */
  header?: React.ReactNode
}

export function DraggableDashboard({ storageKey, widgets, header }: Props) {
  const visible = widgets.filter(w => w.visible !== false)
  const ids = visible.map(w => w.id)

  const [order, setOrder] = useState<string[]>(ids)

  // Sincroniza quando a lista de widgets visíveis mudar (carregamento assíncrono)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed: string[] = JSON.parse(saved)
        // Mantém a ordem salva filtrando apenas os IDs que existem agora
        const merged = [
          ...parsed.filter(id => ids.includes(id)),
          ...ids.filter(id => !parsed.includes(id)),
        ]
        setOrder(merged)
        return
      } catch { /* ignora */ }
    }
    setOrder(ids)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIdx = order.indexOf(active.id as string)
    const newIdx = order.indexOf(over.id as string)
    const next = arrayMove(order, oldIdx, newIdx)
    setOrder(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const sorted = order
    .map(id => visible.find(w => w.id === id))
    .filter(Boolean) as DashWidget[]

  return (
    <div>
      {header && <div className="mb-5">{header}</div>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 md:space-y-5">
            {sorted.map(w => (
              <SortableWidget key={w.id} id={w.id}>
                {w.content}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
