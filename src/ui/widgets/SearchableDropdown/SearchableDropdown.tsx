import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "./SearchableDropdown.css";

export interface DropdownItem {
  key: string;
  value: unknown;
  searchKey?: string;
  displayContentFC?: string | React.FC<{ item: DropdownItem }>;
  dropdownItemFC?: React.FC<{ item: DropdownItem }>;
  disabled?: boolean;
}

interface SearchableDropdownProps {
  items: DropdownItem[];
  value?: unknown;
  placeholder?: string;
  onChange: (value: unknown) => void;
  isTextEditable?: boolean;
  showDropdownButton?: boolean;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  selectedItemColor?: string;
  // 新增：当下拉打开且当前无选中项时，滚动到该值对应的项目位置
  scrollTargetValue?: unknown;
  tabIndex?: number;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  items,
  value,
  placeholder = "",
  onChange,
  isTextEditable = true,
  showDropdownButton = true,
  className = "",
  inputClassName = "",
  dropdownClassName = "",
  selectedItemColor = "var(--selected-item-color)",
  scrollTargetValue,
  tabIndex,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  // 根据外部容器真实高度计算内部 padding / 字号 / 行高（仅向下缩小，不向上增大）
  const [metrics, setMetrics] = useState({ padV: 6, padH: 8, fontSize: 12, lineHeight: 18 });
  const [itemHeight, setItemHeight] = useState<number>(30);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const overscan = 6;
  const userScrollingRef = useRef<boolean>(false);
  const scrollIdleTimerRef = useRef<number | null>(null);
  
  // 标记是否正在进行鼠标按下的交互，用于防止 onFocus 自动展开与点击 toggle 冲突
  const isMouseDownOnInputRef = useRef(false);

  // 标记是否正在进行中文输入法组合输入
  const isComposingRef = useRef(false);

  // 标记交互来源，用于区分鼠标悬停和键盘导航对滚动的不同影响
  const interactionSourceRef = useRef<"mouse" | "keyboard">("keyboard");

  // 记录 isOpen 最新状态，供异步回调使用
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // 仅响应“最后一次点击”：为点击事件增加轻量防抖
  const clickDebounceTimerRef = useRef<number | null>(null);
  const lastClickActionRef = useRef<"toggle" | "close" | null>(null);

  const scheduleLastClick = (action: "toggle" | "close") => {
    lastClickActionRef.current = action;
    if (clickDebounceTimerRef.current) {
      window.clearTimeout(clickDebounceTimerRef.current);
    }
    clickDebounceTimerRef.current = window.setTimeout(() => {
      const act = lastClickActionRef.current;
      lastClickActionRef.current = null;
      if (!act) return;

      if (act === "close") {
        // 强制关闭
        setIsOpen(false);
        setSearchTerm("");
        if (inputRef.current) inputRef.current.blur();
      } else {
        // toggle 基于“当前最新状态”进行
        const open = isOpenRef.current;
        if (!open) {
          setIsOpen(true);
          setSearchTerm("");
          if (inputRef.current) inputRef.current.focus();
        } else {
          setIsOpen(false);
          if (inputRef.current) inputRef.current.blur();
        }
      }
    }, 150);
  };

  // 卸载时清理点击防抖定时器
  useEffect(() => {
    return () => {
      if (clickDebounceTimerRef.current) {
        window.clearTimeout(clickDebounceTimerRef.current);
      }
      if (scrollIdleTimerRef.current) {
        window.clearTimeout(scrollIdleTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const container = inputContainerRef.current;
      const menu = dropdownMenuRef.current;
      if (!container || !menu) return;

      const rect = container.getBoundingClientRect();
      // 使用 absolute 定位到 document.body
      // top = rect.bottom + window.scrollY
      // left = rect.left + window.scrollX
      const top = rect.bottom + window.scrollY;
      const left = rect.left + window.scrollX;

      menu.style.position = "absolute";
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
      menu.style.width = `${rect.width}px`;
      menu.style.right = "auto";
    };

    updatePosition();

    const onResize = () => updatePosition();
    const onScroll = () => updatePosition();

    window.addEventListener("resize", onResize);
    // 监听所有滚动事件（capture），以处理局部容器滚动
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isOpen]);

  // 根据外部容器真实高度计算内部 padding / 字号 / 行高（仅向下缩小，不向上增大）
  useEffect(() => {
    const container = inputContainerRef.current;
    if (!container) return;

    const compute = () => {
      const h = container.clientHeight || container.offsetHeight || 0;
      if (h > 0) {
        // 仅按比例向下缩小，设置上限，不随高度增大而增大
        const padV = Math.min(10, Math.round(h * 0.25));
        const padH = Math.min(12, Math.round(h * 0.35));
        const fontSize = Math.min(14, Math.round(h * 0.6));
        const lineHeight = Math.min(18, Math.max(12, h - padV * 2));
        setMetrics({ padV, padH, fontSize, lineHeight });
      }
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  }, []);

  // 更新选中项：以 value 为主；若 value 未更新则保留之前的 selectedItem
  useEffect(() => {
    const foundItem = items.find((item) => item.value === value);
    if (foundItem) {
      setSelectedItem(foundItem);
    } else if (value === undefined || value === null) {
      setSelectedItem(null);
    }
  }, [value, items]);

  const filteredItems = useMemo(() => items.filter((item) => {
    const rawText = item.searchKey || item.key;
    const text = String(rawText).toLowerCase();
    const terms = searchTerm
      .split(/[，,]/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
    if (terms.length === 0) return true;
    return terms.every((term) => text.includes(term));
  }), [items, searchTerm]);

  // 处理点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(dropdownMenuRef.current && dropdownMenuRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTextEditable) return;
    const newValue = e.target.value;
    setSearchTerm(newValue);
    if (!isOpen) setIsOpen(true);
    if (dropdownMenuRef.current) {
      dropdownMenuRef.current.scrollTop = 0;
    }
    setStartIndex(0);
  };

  const handleItemClick = (item: DropdownItem) => {
    // 如果项目被禁用，则不执行任何操作
    if (item.disabled) {
      return;
    }
    // 仅触发外部 onChange，显示内容由外部 value 更新后再跟随
    onChange(item.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  const [shouldScrollToCenter, setShouldScrollToCenter] = useState(false);

  // 当下拉菜单打开时滚动到选中项（或指定目标项）
  useEffect(() => {
    if (isOpen) {
      // 打开时重置为键盘交互模式，确保可以执行初始滚动
      interactionSourceRef.current = "keyboard";
      let initialIndex = 0;
      if (value !== undefined && value !== null) {
        const index = filteredItems.findIndex((item) => item.value === value);
        if (index !== -1) initialIndex = index;
      } else if (scrollTargetValue !== undefined && scrollTargetValue !== null) {
        const index = filteredItems.findIndex((item) => item.value === scrollTargetValue);
        if (index !== -1) initialIndex = index;
      }
      setHighlightedIndex(initialIndex);
      setShouldScrollToCenter(true);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, value, scrollTargetValue, filteredItems]);

  // 当搜索内容变化时处理滚动
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setShouldScrollToCenter(false);
      if (dropdownMenuRef.current) {
        dropdownMenuRef.current.scrollTop = 0;
      }
    }
  }, [searchTerm]);

  // 核心滚动逻辑：监听 highlightedIndex
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !dropdownMenuRef.current) return;
    if (userScrollingRef.current) return;

    // 如果是鼠标交互导致的选中项变化，不自动调整滚动条
    if (interactionSourceRef.current === "mouse") return;

    const menuEl = dropdownMenuRef.current;
    // 确保 itemHeight 已计算
    if (itemHeight <= 0) return;

    const targetTop = highlightedIndex * itemHeight;

    if (shouldScrollToCenter) {
      // 居中滚动，添加延时确保渲染完成
      const timer = setTimeout(() => {
        if (!dropdownMenuRef.current) return;
        const menuHeight = dropdownMenuRef.current.clientHeight;
        const maxScroll = dropdownMenuRef.current.scrollHeight - menuHeight;
        const centerOffset = (menuHeight - itemHeight) / 2;
        const finalScrollTop = Math.max(0, Math.min(targetTop - centerOffset, maxScroll));
        dropdownMenuRef.current.scrollTop = finalScrollTop;
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // 最小滚动 (Ensure Visible)
      const menuHeight = menuEl.clientHeight;
      const currentScrollTop = menuEl.scrollTop;
      const itemBottom = targetTop + itemHeight;

      if (targetTop < currentScrollTop) {
        menuEl.scrollTop = targetTop;
      } else if (itemBottom > currentScrollTop + menuHeight) {
        menuEl.scrollTop = itemBottom - menuHeight;
      }
    }
  }, [isOpen, highlightedIndex, shouldScrollToCenter, itemHeight]);

  

  useEffect(() => {
    if (!isOpen) return;
    const el = dropdownMenuRef.current;
    if (!el) return;
    let h = itemHeight;
    const cs = getComputedStyle(el);
    const v = cs.getPropertyValue("--sdd-item-height");
    if (v) {
      const px = parseInt(v.replace("px", "").trim(), 10);
      if (!Number.isNaN(px) && px > 0) h = px;
    }
    setItemHeight(h);
    const vc = Math.max(1, Math.ceil(el.clientHeight / h));
    setVisibleCount(vc);
    setStartIndex(Math.floor(el.scrollTop / h));
    const ro = new ResizeObserver(() => {
      const vc2 = Math.max(1, Math.ceil(el.clientHeight / h));
      setVisibleCount(vc2);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [isOpen]);

  const handleMenuScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const si = Math.floor(el.scrollTop / itemHeight);
    if (si !== startIndex) setStartIndex(si);
    userScrollingRef.current = true;
    if (scrollIdleTimerRef.current) {
      window.clearTimeout(scrollIdleTimerRef.current);
    }
    scrollIdleTimerRef.current = window.setTimeout(() => {
      userScrollingRef.current = false;
    }, 150);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    if (inputRef.current) inputRef.current.focus();
    scheduleLastClick("toggle");
  };

  const handleInputMouseDown = () => {
    isMouseDownOnInputRef.current = true;
  };

  const handleInputFocus = () => {
    // 如果是鼠标交互导致的 focus，交由 click handler 处理 toggle 逻辑
    if (isMouseDownOnInputRef.current) {
      isMouseDownOnInputRef.current = false;
      return;
    }
    // 如果是键盘交互（如 Tab）导致的 focus，自动展开
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // 失去焦点时关闭
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleInputTouchStart = () => {
    isMouseDownOnInputRef.current = true;
    if (inputRef.current) inputRef.current.focus();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    isMouseDownOnInputRef.current = true;
    if (inputRef.current) inputRef.current.focus();
    scheduleLastClick("toggle");
  };

  const handleOverlayTouchStart = () => {
    isMouseDownOnInputRef.current = true;
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 如果正在进行输入法组合输入，不处理任何键盘导航事件
    if (isComposingRef.current) return;

    interactionSourceRef.current = "keyboard";

    if (e.key === "Enter") {
      if (isOpen && filteredItems.length > 0) {
        e.preventDefault();
        const index = highlightedIndex >= 0 && highlightedIndex < filteredItems.length ? highlightedIndex : 0;
        handleItemClick(filteredItems[index]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    } else if (e.key === "ArrowDown") {
      // 输入法状态下不应该触发这里，因为上面的 isComposingRef.current 已经拦截
      // 但为了保险起见，这里也可以再次确认（通常不需要）
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) => {
        if (filteredItems.length === 0) return -1;
        const next = prev + 1;
        return next >= filteredItems.length ? 0 : next;
      });
      // 键盘操作时取消“居中滚动”模式，改为“确保可见”模式
      setShouldScrollToCenter(false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) => {
        if (filteredItems.length === 0) return -1;
        const next = prev - 1;
        return next < 0 ? filteredItems.length - 1 : next;
      });
      setShouldScrollToCenter(false);
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };

  // 渲染显示内容：仅根据当前 value 定位对应条目进行展示
  const renderDisplayContent = () => {
    const current = items.find((item) => item.value === value) || selectedItem;
    if (!current) return null;
    if (current.displayContentFC) {
      if (typeof current.displayContentFC === "function") {
        const DisplayComponent = current.displayContentFC;
        return <DisplayComponent item={current} />;
      }
      return current.displayContentFC;
    }
    return current.key;
  };
  const currentItem = items.find((item) => item.value === value) || selectedItem;
  let displpayText = isOpen ? searchTerm : "";
  return (
    <div className={`sdd-searchable-dropdown ${className ? className : ""}`} ref={dropdownRef}>
      <div className={`sdd-input-container ${inputClassName}`} ref={inputContainerRef}>
        <input
          ref={inputRef}
          type="text"
          className="sdd-input"
          style={{
            padding: `${metrics.padV}px ${metrics.padH}px`,
            fontSize: `${metrics.fontSize}px`,
            lineHeight: `${metrics.lineHeight}px`,
          }}
          tabIndex={tabIndex}
          value={displpayText}
          placeholder={
            (isOpen || !selectedItem) && displpayText === "" ? placeholder : ""
          }
          onChange={handleInputChange}
          onClick={handleInputClick}
          onMouseDown={handleInputMouseDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onTouchStart={handleInputTouchStart}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          readOnly={!isTextEditable}
        />

        {/* 不展开时显示自定义内容的覆盖层 */}
        {!isOpen && currentItem && (
          <div
            className="sdd-display-overlay"
            onClick={handleOverlayClick}
            onTouchStart={handleOverlayTouchStart}
            style={{
              padding: `${metrics.padV}px ${metrics.padH}px`,
              fontSize: `${metrics.fontSize}px`,
            }}
          >
            <div className="sdd-display-overlay-inner">
              {renderDisplayContent()}
            </div>
          </div>
        )}

        {showDropdownButton && (
          <button
            type="button"
            className={`sdd-dropdown-button ${isOpen ? "sdd-open" : ""}`}
            onClick={() => scheduleLastClick("toggle")}
            tabIndex={-1}
          >
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {isOpen && createPortal(
        <div
          className={`sdd-dropdown-menu ${dropdownClassName}`}
          ref={dropdownMenuRef}
          onScroll={handleMenuScroll}
          onMouseDown={(e) => e.preventDefault()}
        >
          {filteredItems.length > 0 ? (
            (() => {
              const useWindowing = filteredItems.length > 200;
              if (!useWindowing) {
                return filteredItems.map((item, index) => {
                  const ItemComponent = item.dropdownItemFC;
                  const isDisabled = item.disabled;
                  return (
                    <div
                      key={`${String(item.value)}-${index}`}
                      className={`sdd-dropdown-item ${
                        item.value === value ? "sdd-selected" : ""
                      } ${highlightedIndex === index ? "sdd-highlighted" : ""} ${isDisabled ? "sdd-disabled" : ""}`}
                      onClick={() => !isDisabled && handleItemClick(item)}
                      onMouseEnter={() => {
                        if (!isDisabled) {
                          interactionSourceRef.current = "mouse";
                          setHighlightedIndex(index);
                        }
                      }}
                      style={{
                        backgroundColor:
                          item.value === value ? selectedItemColor : undefined,
                      }}
                    >
                      {ItemComponent ? <ItemComponent item={item} /> : item.key}
                    </div>
                  );
                });
              }
              const totalCount = filteredItems.length;
              const renderStart = Math.max(0, startIndex - overscan);
              const endIndex = Math.min(totalCount, startIndex + visibleCount + overscan);
              const slice = filteredItems.slice(renderStart, endIndex);
              const topSpacer = renderStart * itemHeight;
              const bottomSpacer = (totalCount - endIndex) * itemHeight;
              return (
                <>
                  <div style={{ height: topSpacer }} />
                  {slice.map((item, index) => {
                    const ItemComponent = item.dropdownItemFC;
                    const isDisabled = item.disabled;
                    return (
                      <div
                        key={`${String(item.value)}-${renderStart + index}`}
                        className={`sdd-dropdown-item ${
                          item.value === value ? "sdd-selected" : ""
                        } ${highlightedIndex === renderStart + index ? "sdd-highlighted" : ""} ${isDisabled ? "sdd-disabled" : ""}`}
                        onClick={() => !isDisabled && handleItemClick(item)}
                        onMouseEnter={() => {
                          if (!isDisabled) {
                            interactionSourceRef.current = "mouse";
                            setHighlightedIndex(renderStart + index);
                          }
                        }}
                        style={{
                          backgroundColor:
                            item.value === value ? selectedItemColor : undefined,
                        }}
                      >
                        {ItemComponent ? <ItemComponent item={item} /> : item.key}
                      </div>
                    );
                  })}
                  <div style={{ height: bottomSpacer }} />
                </>
              );
            })()
          ) : (
            <div className="sdd-dropdown-item sdd-no-results">
              {t("noResults")}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchableDropdown;
