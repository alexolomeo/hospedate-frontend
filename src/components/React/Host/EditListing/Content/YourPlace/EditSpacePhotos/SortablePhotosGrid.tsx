import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ListingPhoto } from '@/services/host/edit-listing/gallery';
import clsx from 'clsx';

interface Props {
  photos: ListingPhoto[];
  onReorder: (updated: ListingPhoto[]) => void;
}

export default function SortablePhotosGrid({ photos, onReorder }: Props) {
  const [items, setItems] = useState<ListingPhoto[]>(photos);
  useEffect(() => {
    setItems(photos);
  }, [photos]);

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    const newOrder = arrayMove(items, oldIndex, newIndex);

    setItems(newOrder);
    onReorder(newOrder);
  };

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((p) => p.id)}>
        <div className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((photo) => (
            <SortablePhoto key={photo.id} photo={photo} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortablePhotoProps {
  photo: ListingPhoto;
}

function SortablePhoto({ photo }: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: photo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'border-base-200 relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-[16px] border shadow-sm transition-transform',
        isDragging && 'z-10 scale-105 opacity-80'
      )}
    >
      <img
        src={photo.photo.original}
        alt={photo.caption ?? ''}
        className="h-full w-full object-cover"
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}
