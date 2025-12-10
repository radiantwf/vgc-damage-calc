import React from "react";
import "./SegmentedButtons.css";
import ToggleButton from "../ToggleButton/ToggleButton";

export type SegmentedOption<K = unknown> = {
  key: K;
  label: React.ReactNode;
};

interface CommonProps<K = unknown> {
  options: ReadonlyArray<SegmentedOption<K>>;
  className?: string;
  disabled?: boolean;
  // 可选的布局方向：默认水平，不影响现有调用
  orientation?: "horizontal" | "vertical";
  tabIndexStart?: number;
}

export interface SegmentedButtonsSingleProps<K = unknown> extends CommonProps<K> {
  multiple?: false;
  allowNone?: false;
  value: K;
  onChange: (key: K) => void;
}

export interface SegmentedButtonsSingleNullableProps<K = unknown> extends CommonProps<K> {
  multiple?: false;
  allowNone: true;
  value: K | undefined;
  onChange: (key: K | undefined) => void;
}

export interface SegmentedButtonsMultiProps<K = unknown> extends CommonProps<K> {
  multiple: true;
  value: ReadonlyArray<K>;
  onChange: (keys: ReadonlyArray<K>) => void;
}

export type SegmentedButtonsProps<K = unknown> =
  | SegmentedButtonsSingleProps<K>
  | SegmentedButtonsSingleNullableProps<K>
  | SegmentedButtonsMultiProps<K>;

// 重载以改进类型推断：根据 multiple 区分单选与多选
function SegmentedButtons<K = unknown>(props: SegmentedButtonsSingleNullableProps<K>): React.ReactElement;
function SegmentedButtons<K = unknown>(props: SegmentedButtonsSingleProps<K>): React.ReactElement;
function SegmentedButtons<K = unknown>(props: SegmentedButtonsMultiProps<K>): React.ReactElement;
function SegmentedButtons<K = unknown>(props: SegmentedButtonsProps<K>) {
  // 不通过 size 参数控制大小
  const { options, className, disabled = false, orientation = "horizontal", tabIndexStart } = props;
  const isMulti = props.multiple === true;
  const isNullableSingle = !isMulti && (props as SegmentedButtonsSingleNullableProps<K>).allowNone === true;

  const isActive = (key: K) =>
    isMulti
      ? (props.value as ReadonlyArray<K>).includes(key)
      : (props.value as K | undefined) === key;

  const handleClick = (key: K) => {
    if (disabled) return;
    if (isMulti) {
      const selected = (props.value as ReadonlyArray<K>) || [];
      const has = selected.includes(key);
      const next = has ? selected.filter((k) => k !== key) : [...selected, key];
      (props as SegmentedButtonsMultiProps<K>).onChange(next);
    } else {
      if (isNullableSingle) {
        const current = props.value as K | undefined;
        const next = current === key ? undefined : key;
        (props as SegmentedButtonsSingleNullableProps<K>).onChange(next);
      } else {
        (props as SegmentedButtonsSingleProps<K>).onChange(key);
      }
    }
  };

  return (
    <div
      className={`segmented-buttons ${orientation === "vertical" ? "segmented-buttons--vertical" : ""} ${
        className || ""
      }`.trim()}
    >
      {options.map((option, index) => {
        const reactKey =
          typeof option.key === "string" || typeof option.key === "number" ? option.key : index;
        const edgeClass =
          orientation === "vertical"
            ? index === 0
              ? "rounded-top"
              : index === options.length - 1
              ? "rounded-bottom"
              : ""
            : index === 0
            ? "rounded-left"
            : index === options.length - 1
            ? "rounded-right"
            : "";
        return (
          <ToggleButton
            key={reactKey}
            label={option.label}
            active={isActive(option.key)}
            onClick={() => handleClick(option.key)}
            disabled={disabled}
            className={edgeClass}
            tabIndex={typeof tabIndexStart === 'number' ? tabIndexStart + index : undefined}
          />
        );
      })}
    </div>
  );
}

export default SegmentedButtons;
