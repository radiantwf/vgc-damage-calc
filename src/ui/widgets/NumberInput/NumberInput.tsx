import React, { useState, useEffect, useRef } from 'react';
import './NumberInput.css';

interface NumberInputProps {
  value?: number | null;
  defaultValue?: number | null;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  onChange?: (value: number | null) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  tabIndex?: number;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value: controlledValue,
  defaultValue,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  disabled = false,
  className = '',
  placeholder,
  style,
  autoFocus,
  onChange,
  onBlur,
  onFocus,
  tabIndex,
}) => {
  const [internalValue, setInternalValue] = useState<number | null>(defaultValue ?? null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  // 监听父容器尺寸变化，动态计算圆角
  useEffect(() => {
    const wrapperElement = wrapperRef.current;
    if (!wrapperElement) return;

    const updateBorderRadius = () => {
      const parentElement = wrapperElement.parentElement;
      if (!parentElement) return;

      // 获取父容器的实际尺寸
      const rect = parentElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // 计算圆角：min(width, height) / 4
      const minDimension = Math.min(width, height);
      const borderRadius = Math.round(minDimension / 5);
      
      // 设置CSS变量
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

  // 限制数值在范围内
  const clampValue = (val: number | null): number | null => {
    if (val === null) return null;
    if (val < min) return min;
    if (val > max) return max;
    return val;
  };

  // 更新值的通用函数
  const updateValue = (newValue: number | null) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  // 输入框值变化事件
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (val === '') {
      updateValue(null);
      return;
    }

    const num = Number(val);
    if (!Number.isNaN(num)) {
      updateValue(num);
    }
  };

  // 失焦时自动修正超出范围的值
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const clamped = clampValue(currentValue);
    if (clamped !== currentValue) {
      updateValue(clamped);
    }
    onBlur?.(e);
  };

  // 获得焦点事件
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e);
  };

  // 增加数值
  const handleIncrement = () => {
    if (disabled) return;
    const baseValue = currentValue ?? min;
    const newValue = clampValue(baseValue + step);
    updateValue(newValue);
  };

  // 减少数值
  const handleDecrement = () => {
    if (disabled) return;
    const baseValue = currentValue ?? min;
    const newValue = clampValue(baseValue - step);
    updateValue(newValue);
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
    } else if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  // 组合样式类名
  const wrapperClasses = [
    'number-input-wrapper',
    disabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ');

  // 初始化时确保值在范围内
  useEffect(() => {
    const clamped = clampValue(currentValue);
    if (clamped !== currentValue && currentValue !== null) {
      updateValue(clamped);
    }
  }, [min, max, clampValue, currentValue, updateValue]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div ref={wrapperRef} className={wrapperClasses} style={style}>
      <input
        type="number"
        className="number-input"
        ref={inputRef}
        value={currentValue === null ? '' : currentValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        tabIndex={tabIndex}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
      />
      <div className="number-buttons">
        <button 
          type="button" 
          className="number-btn number-btn-increment" 
          tabIndex={-1} 
          disabled={disabled || currentValue === max}
          onClick={handleIncrement}
          onMouseDown={(e) => e.preventDefault()}
        >
          ▲
        </button>
        <button 
          type="button" 
          className="number-btn number-btn-decrement" 
          tabIndex={-1} 
          disabled={disabled || currentValue === min}
          onClick={handleDecrement}
          onMouseDown={(e) => e.preventDefault()}
        >
          ▼
        </button>
      </div>
    </div>
  );
};

export default NumberInput;
