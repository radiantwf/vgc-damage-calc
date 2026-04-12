import React, { useState, useEffect, useRef } from 'react';
import './EVInput.css';

export interface EVInputProps {
  value?: string | null;
  defaultValue?: string | null;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  onChange?: (value: string | null) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  // 新增：每次步进的步长（默认4，适配EV）
  step?: number;
  // 新增：外部方法，返回“下一次导致能力值变化”的EV值（需自行考虑最小/最大限制与步长）
  getNextEVForStatChange?: (
    direction: 'up' | 'down',
    currentEV: number,
    ctx: { min: number; max: number; step: number }
  ) => number;
  normalizeNumericValue?: (value: number) => number;
  // 新增：是否允许输入 + / - 号（默认允许；HP 场景需要禁用）
  allowPlusMinus?: boolean;
  tabIndex?: number;
}

const EVInput: React.FC<EVInputProps> = ({
  value: controlledValue,
  defaultValue,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  disabled = false,
  className = '',
  placeholder,
  style,
  onChange,
  onBlur,
  onFocus,
  onIncrement,
  onDecrement,
  step = 4,
  getNextEVForStatChange,
  normalizeNumericValue,
  allowPlusMinus = true,
  tabIndex,
}) => {
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  // 新增：显示值与焦点状态
  const [displayValue, setDisplayValue] = useState<string>(currentValue ?? '');
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // 监听父容器尺寸变化，动态计算圆角
  useEffect(() => {
    const wrapperElement = wrapperRef.current;
    if (!wrapperElement) return;

    const updateBorderRadius = () => {
      const parentElement = wrapperElement.parentElement;
      if (!parentElement) return;
      const parentHeight = parentElement.clientHeight;
      const parentWidth = parentElement.clientWidth;
      const minSide = Math.min(parentHeight, parentWidth);
      const borderRadius = Math.max(4, Math.floor(minSide * 0.1));
      wrapperElement.style.setProperty('--dynamic-border-radius', `${borderRadius}px`);
    };

    // 初始计算
    updateBorderRadius();

    // 创建 ResizeObserver 监听父容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      updateBorderRadius();
    });

    // 监听父容器
    const parentElement = wrapperElement.parentElement;
    if (parentElement) {
      resizeObserver.observe(parentElement);
    }

    // 监听窗口大小变化（作为备选方案）
    window.addEventListener('resize', updateBorderRadius);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateBorderRadius);
    };
  }, []);

  // 新增：当外部受控值变化且当前未聚焦时，同步显示值
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(currentValue ?? '');
    }
  }, [currentValue, isFocused]);

  // 校验规则：允许数字与单个+/-在首尾（HP 禁用时不允许 +/-）
  const isValidInput = (val: string): boolean => {
    if (val === '' || val === null) return true;
    const pattern = allowPlusMinus ? /^(?:[+-]?\d*|\d*[+-]?)$/ : /^\d*$/;
    if (!pattern.test(val)) return false;
    if (allowPlusMinus) {
      // 同时包含+和-不允许
      if (val.includes('+') && val.includes('-')) return false;
    }
    return true;
  };

  // 更新值的通用函数
  const updateValue = (newValue: string | null) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const applyNumericConstraints = (value: number): number => {
    const clamped = Math.min(Math.max(value, min), max);
    const normalized = normalizeNumericValue?.(clamped) ?? clamped;
    return Math.min(Math.max(normalized, min), max);
  };

  // 输入框值变化事件（受控显示）：非法输入直接忽略
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setDisplayValue('');
      updateValue(null);
      return;
    }
    if (isValidInput(val)) {
      // 若允许 +/-，当数值部分为 0 或空且存在 +/-，立即规范化显示为单独的 +/-
      let nextVal = val;
      if (allowPlusMinus) {
        const hasPlus = val.includes('+');
        const hasMinus = val.includes('-');
        const sign = hasPlus ? '+' : (hasMinus ? '-' : '');
        const numericPart = val.replace(/[+-]/g, '');
        if (sign && (numericPart === '' || /^0+$/.test(numericPart))) {
          nextVal = sign;
        }
      }
      const normalizedNumericPart = nextVal.replace(/[+-]/g, '');
      if (normalizedNumericPart !== '') {
        const hasPlus = nextVal.includes('+');
        const hasMinus = nextVal.includes('-');
        const sign = hasPlus ? '+' : hasMinus ? '-' : '';
        const normalizedValue = applyNumericConstraints(Number(normalizedNumericPart));
        nextVal = sign ? `${normalizedValue}${sign}` : String(normalizedValue);
      }
      setDisplayValue(nextVal);
      updateValue(nextVal);
    }
  };

  // 失焦时处理：不再覆盖显示值，保留用户输入（包括+/-符号）
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // 获得焦点事件
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  // 键盘按键事件 - 限制输入字符
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const char = e.key;
    const currentVal = (e.target as HTMLInputElement).value;
    const cursorPos = (e.target as HTMLInputElement).selectionStart || 0;
    // 允许控制键（功能键）
    if (char.length > 1) return;
    // 仅允许数字；当允许时也允许 + / -
    if (!/[0-9]/.test(char)) {
      if (!(allowPlusMinus && /[+-]/.test(char))) {
        e.preventDefault();
        return;
      }
    }
    if (char === '+' || char === '-') {
      if (!allowPlusMinus) {
        e.preventDefault();
        return;
      }
      const hasPlus = currentVal.includes('+');
      const hasMinus = currentVal.includes('-');
      if ((char === '+' && hasPlus) || (char === '-' && hasMinus) || (hasPlus && hasMinus)) {
        e.preventDefault();
        return;
      }
      // 只能首位或末位
      if (cursorPos !== 0 && cursorPos !== currentVal.length) {
        e.preventDefault();
        return;
      }
    }
  };

  // 粘贴限制：若整体不合法则阻止
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (!isValidInput(text)) {
      e.preventDefault();
    }
  };

  // 辅助：解析当前显示值为数值EV
  const parseCurrentEV = (): number => {
    const raw = currentValue ?? displayValue;
    if (!raw) return min;
    const cleaned = raw.replace(/[+-]/g, '');
    const num = Number(cleaned);
    if (Number.isNaN(num)) return min;
    return applyNumericConstraints(num);
  };

  // 键盘上下箭头事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  // 增加数值
  const handleIncrement = () => {
    if (disabled) return;
    const currentEV = parseCurrentEV();
    let nextEV: number;
    if (getNextEVForStatChange) {
      nextEV = getNextEVForStatChange('up', currentEV, { min, max, step });
      if (typeof nextEV !== 'number' || Number.isNaN(nextEV)) {
        nextEV = currentEV + step;
      } else {
        nextEV = applyNumericConstraints(nextEV);
      }
    } else {
      // 默认行为：按步长递增并限制在[min, max]范围内
      nextEV = currentEV + step;
    }
    nextEV = applyNumericConstraints(nextEV);
    // 保留现有 +/- 号（若允许且当前显示存在符号）
    let sign = '';
    if (allowPlusMinus) {
      if (displayValue.includes('+')) sign = '+';
      else if (displayValue.includes('-')) sign = '-';
    }
    const nextStr = String(nextEV);
    const nextStrWithSign = sign ? `${nextStr}${sign}` : nextStr;
    onIncrement?.();
    setDisplayValue(nextStrWithSign);
    updateValue(nextStrWithSign);
  };

  // 减少数值
  const handleDecrement = () => {
    if (disabled) return;
    const currentEV = parseCurrentEV();
    let nextEV: number;
    if (getNextEVForStatChange) {
      nextEV = getNextEVForStatChange('down', currentEV, { min, max, step });
      if (typeof nextEV !== 'number' || Number.isNaN(nextEV)) {
        nextEV = currentEV - step;
      } else {
        nextEV = applyNumericConstraints(nextEV);
      }
    } else {
      // 默认行为：按步长递减并限制在[min, max]范围内
      nextEV = currentEV - step;
    }
    nextEV = applyNumericConstraints(nextEV);
    // 保留现有 +/- 号（若允许且当前显示存在符号）
    let sign = '';
    if (allowPlusMinus) {
      if (displayValue.includes('+')) sign = '+';
      else if (displayValue.includes('-')) sign = '-';
    }
    const nextStr = String(nextEV);
    const nextStrWithSign = sign ? `${nextStr}${sign}` : nextStr;
    onDecrement?.();
    setDisplayValue(nextStrWithSign);
    updateValue(nextStrWithSign);
  };

  // 组合样式类名
  const wrapperClasses = [
    'ev-input-wrapper',
    disabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ');

  // 新增：根据当前值与上下限，禁用 +/- 按钮
  const numericEV = parseCurrentEV();
  const isAtMin = numericEV <= min;
  const isAtMax = numericEV >= max;

  return (
    <div ref={wrapperRef} className={wrapperClasses} style={style}>
      <input
        type="text"
        className="ev-input"
        value={displayValue}
        disabled={disabled}
        placeholder={placeholder}
        tabIndex={tabIndex}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyPress={handleKeyPress}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        ref={inputRef}
      />
      <div className="ev-buttons">
        <button 
          type="button" 
          className="ev-btn ev-btn-increment" 
          tabIndex={-1} 
          disabled={disabled || isAtMax}
          onClick={handleIncrement}
          onMouseDown={(e) => { e.preventDefault(); inputRef.current?.blur(); }}
        >
          ▲
        </button>
        <button 
          type="button" 
          className="ev-btn ev-btn-decrement" 
          tabIndex={-1} 
          disabled={disabled || isAtMin}
          onClick={handleDecrement}
          onMouseDown={(e) => { e.preventDefault(); inputRef.current?.blur(); }}
        >
          ▼
        </button>
      </div>
    </div>
  );
};

export default EVInput;
