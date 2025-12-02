import AppIcon from '@/components/React/Common/AppIcon';
import { memo } from 'react';
import { translate } from '@/utils/i18n';

export interface ItemLite {
  key: string;
  label: string;
}

interface Props {
  title?: string;
  items: ItemLite[];
  folder: string;
  hideIconForKey?: string;
}

export const IconListing = memo(function AmenityList({
  title,
  items,
  folder,
  hideIconForKey,
}: Props) {
  return (
    <div>
      {title && <p className="pb-6 font-bold">{title}</p>}

      <div className="mt-1 flex list-none flex-col gap-1 pl-0 text-xs">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-start gap-2">
            {item.key !== hideIconForKey && (
              <AppIcon
                iconName={item.key}
                folder={folder}
                className="text-secondary h-4 w-4"
                loaderCompact
              />
            )}
            <p className="text-sm">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

interface TruncatedIconListProps {
  items: ItemLite[];
  folder: string;
  maxItems?: number;
  hideIconForKey?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: Record<string, any>;
  moreCountKey: string;
}

const DEFAULT_MAX_ITEMS = 3;

export const TruncatedIconList = memo(function TruncatedIconList({
  items,
  folder,
  maxItems = DEFAULT_MAX_ITEMS,
  hideIconForKey,
  translations,
  moreCountKey,
}: TruncatedIconListProps) {
  const visibleItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;
  const hasMore = remainingCount > 0;

  const displayText = translate(translations, moreCountKey, {
    count: remainingCount,
  });

  return (
    <div className="mt-1 flex flex-col gap-3">
      <IconListing
        items={visibleItems}
        folder={folder}
        hideIconForKey={hideIconForKey}
      />
      {hasMore && (
        <div className="pl-6 text-xs font-medium text-neutral-500">
          {displayText}
        </div>
      )}
    </div>
  );
});
