// components/Slider.tsx
import React, { useCallback, ChangeEvent, useRef, useState, useEffect } from 'react';
import './Slider.css';

// 类型定义
export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  showTicks?: boolean;
  label?: string;
  tickCount?: number;
  formatValue?: (value: number) => string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  showRange?: boolean;
  tabIndex?: number;
}

const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  disabled = false,
  className = '',
  id = 'slider',
  showTicks = false,
  label,
  tickCount = 11,
  formatValue = (value: number) => value.toString(),
  variant = 'primary',
  showValue = true,
  showRange = false
  , tabIndex
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sliderRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 200,
    height: 40
  });

  // 使用ResizeObserver监听外部容器尺寸变化
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          setContainerSize({ width, height });
        }
      }
    });

    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  const updateValue = useCallback((newValue: number): void => {
    const clampedValue = Math.max(min, Math.min(max, Number(newValue.toFixed(3))));
    onChange(clampedValue);
  }, [min, max, onChange]);

  const handleSliderChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    const newValue = Number(event.target.value);
    updateValue(newValue);
  }, [updateValue]);

  const handleMouseDown = useCallback((): void => {
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  // 新增：触摸与指针事件，保证拖动状态在移动端/指针设备上也能正确设置
  const handleTouchStart = useCallback((): void => {
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleTouchEnd = useCallback((): void => {
    setIsDragging(false);
  }, []);

  const handlePointerDown = useCallback((): void => {
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handlePointerUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  // 新增：在拖动过程中监听全局的松开事件，避免拖出元素后状态不恢复
  useEffect(() => {
    if (!isDragging) return;
    const handler = () => setIsDragging(false);
    window.addEventListener('mouseup', handler);
    window.addEventListener('touchend', handler, { passive: true });
    window.addEventListener('pointerup', handler);
    return () => {
      window.removeEventListener('mouseup', handler);
      window.removeEventListener('touchend', handler);
      window.removeEventListener('pointerup', handler);
    };
  }, [isDragging]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent): void => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        event.preventDefault();
        updateValue(value + step);
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        event.preventDefault();
        updateValue(value - step);
        break;
      case 'Home':
        event.preventDefault();
        updateValue(min);
        break;
      case 'End':
        event.preventDefault();
        updateValue(max);
        break;
      case 'PageUp':
        event.preventDefault();
        updateValue(value + step * 10);
        break;
      case 'PageDown':
        event.preventDefault();
        updateValue(value - step * 10);
        break;
    }
  }, [disabled, updateValue, value, step, min, max]);

  // 生成刻度标记
  const generateTicks = useCallback((): React.ReactElement[] | null => {
    if (!showTicks || containerSize.width < 60) return null; // 宽度太小时隐藏刻度
    
    const actualTickCount = Math.min(tickCount, Math.floor((max - min) / step) + 1, Math.floor(containerSize.width / 40));
    const tickStep = (max - min) / Math.max(1, actualTickCount - 1);
    
    return Array.from({ length: actualTickCount }, (_, i) => {
      const tickValue = min + i * tickStep;
      const position = ((tickValue - min) / (max - min)) * 100;
      
      return (
        <div
          key={i}
          className="slider-tick-mark"
          style={{ left: `${position}%` }}
        >
          <span className="slider-tick-label">
            {formatValue(Math.round(tickValue / step) * step)}
          </span>
        </div>
      );
    });
  }, [showTicks, tickCount, max, min, step, formatValue, containerSize.width]);

  const getSliderProgress = useCallback((): number => {
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  // 计算自适应尺寸
  const adaptiveHeight = Math.max(containerSize.height >= 15 ? containerSize.height : 15, 15);
  const adaptiveWidth = Math.max(containerSize.width >= 30 ? containerSize.width : 30, 30);
  
  // 计算滑块轨道高度（相对于容器高度）
  const trackHeight = Math.min(Math.max(adaptiveHeight * 0.2, 4), 12);
  
  // 计算滑块按钮大小（相对于容器高度）
  const thumbSize = Math.min(Math.max(adaptiveHeight * 0.6, 16), 32);

  // 根据容器高度调整字体大小
  const fontSize = Math.min(Math.max(adaptiveHeight * 0.35, 11), 16);

  const containerClasses = [
    'slider-container',
    `slider-variant-${variant}`,
    className,
    disabled && 'slider-disabled',
    isDragging && 'slider-dragging',
    containerSize.height < 25 && 'slider-compact-height',
    containerSize.width < 60 && 'slider-compact-width'
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={containerRef} 
      className={containerClasses}
      style={{
        '--slider-container-height': `${adaptiveHeight}px`,
        '--slider-container-width': `${adaptiveWidth}px`,
        '--slider-track-height': `${trackHeight}px`,
        '--slider-thumb-size': `${thumbSize}px`,
        '--slider-font-size': `${fontSize}px`
      } as React.CSSProperties}
    >
      {label && containerSize.height > 35 && (
        <div className="slider-label-wrapper">
          <label htmlFor={`${id}-range`} className="slider-label">
            {label}
          </label>
        </div>
      )}
      
      <div className="slider-wrapper">
        <input
          ref={sliderRef}
          id={`${id}-range`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="slider-input"
          tabIndex={tabIndex}
          aria-describedby={`${id}-description`}
        />
        <div className="slider-track">
          <div 
            className="slider-progress" 
            style={{ width: `${getSliderProgress()}%` }}
          />
        </div>
        {showTicks && (
          <div className="slider-tick-container">
            {generateTicks()}
          </div>
        )}
      </div>
      
      {(showValue || showRange) && containerSize.height > 30 && (
        <div className="slider-value-display">
          {showValue && (
            <span className="slider-current-value">
              {formatValue(value)}
            </span>
          )}
          {showRange && containerSize.width > 120 && (
            <span className="slider-value-range">
              ({formatValue(min)} - {formatValue(max)})
            </span>
          )}
        </div>
      )}

      <div id={`${id}-description`} className="slider-sr-only">
        滑块控件，数值范围从 {formatValue(min)} 到 {formatValue(max)}，步长为 {step}
      </div>
    </div>
  );
};

export default Slider;
