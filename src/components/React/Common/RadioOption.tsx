import React, { useMemo, useId } from 'react';

interface RadioOptionProps {
  id: string;
  name: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (id: string) => void;
  buttonLabel?: string;
  buttonAction?: () => void;
  disabled?: boolean;
  /**
   * Optional flag to isolate radio groups.
   * When true (default), ensures radios in different layouts
   * (e.g., desktop/mobile) don't share the same name.
   */
  isolateGroup?: boolean;
}

export const RadioOption: React.FC<RadioOptionProps> = ({
  id,
  name,
  label,
  description,
  checked,
  onChange,
  buttonLabel,
  buttonAction,
  disabled = false,
  isolateGroup = true, // prevents duplicated names across layouts
}) => {
  // Stable unique suffix for consistent naming across re-renders
  const reactId = useId();

  // Use unique group name when isolation is required
  const uniqueName = useMemo(() => {
    if (!isolateGroup) return name;
    return `${name}-${reactId}`;
  }, [name, isolateGroup, reactId]);

  return (
    <div className="flex items-start gap-x-4">
      <input
        type="radio"
        id={id}
        name={uniqueName}
        value={id}
        className="radio radio-primary radio-sm"
        checked={checked}
        onChange={() => {
          if (!disabled) onChange(id);
        }}
        disabled={disabled}
      />

      <div className="space-y-[5px]">
        <label
          htmlFor={id}
          className="cursor-pointer space-y-[5px] select-none"
        >
          <p className="text-sm font-normal">{label}</p>
          <p className="text-neutral text-xs font-normal">{description}</p>
        </label>

        {buttonLabel && buttonAction && (
          <button
            type="button"
            className="text-base-content cursor-pointer px-2 text-xs font-normal underline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) buttonAction();
            }}
            disabled={disabled}
            aria-disabled={disabled}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
};
