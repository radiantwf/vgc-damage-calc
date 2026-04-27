import React from "react";
import EditAreaProps from "../Props/EditAreaProps";
import "./Team.css";
import { useTeamState } from "../../../../contexts/TeamContext";

import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiCopy,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { confirmable, ContextAwareConfirmation } from "react-confirm";
import ConfirmDialog, {
  type ConfirmPayload,
} from "../../../widgets/ConfirmDialog/ConfirmDialog";

const Team: React.FC<EditAreaProps> = ({ isAttacker }) => {
  const {
    slots,
    selectedIndex,
    selectSlot,
    moveSlot,
    addSlot,
    removeSlot,
    exportTeamToClipboard,
    importTeamFromClipboard,
  } = useTeamState(isAttacker);
  const { t } = useTranslation("app");
  const [toastText, setToastText] = React.useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);
  const [dragOverGapIndex, setDragOverGapIndex] = React.useState<number | null>(
    null
  );
  const slotCardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const previousSlotRectsRef = React.useRef<Record<string, DOMRect>>({});
  const shouldAnimateReorderRef = React.useRef<boolean>(false);
  const tabBase = isAttacker ? 340000 : 350000;

  const confirm = ContextAwareConfirmation.createConfirmation(
    confirmable(ConfirmDialog)
  ) as <R>(payload: ConfirmPayload<R>) => Promise<R>;

  const handleCopyTeam = React.useCallback(async () => {
    const ok = await exportTeamToClipboard();
    if (ok) setToastText(t("team.copyTeamSuccess"));
  }, [exportTeamToClipboard, t]);

  const handleImportTeam = React.useCallback(async () => {
    const ok = await importTeamFromClipboard();
    if (ok) setToastText(t("team.importTeamSuccess"));
  }, [importTeamFromClipboard, t]);

  const handleDragStart = React.useCallback((index: number) => {
    setDraggingIndex(index);
    setDragOverGapIndex(index);
  }, []);

  const handleDragEnd = React.useCallback(() => {
    setDraggingIndex(null);
    setDragOverGapIndex(null);
  }, []);

  const handleDropAtGap = React.useCallback(
    (gapIndex: number) => {
      if (draggingIndex === null) {
        setDraggingIndex(null);
        setDragOverGapIndex(null);
        return;
      }
      const normalizedIndex =
        draggingIndex < gapIndex ? gapIndex - 1 : gapIndex;
      if (normalizedIndex !== draggingIndex) {
        shouldAnimateReorderRef.current = true;
      }
      moveSlot(draggingIndex, gapIndex);
      setDraggingIndex(null);
      setDragOverGapIndex(null);
    },
    [draggingIndex, moveSlot]
  );

  const handleRemoveSlot = React.useCallback(
    async (index: number) => {
      const ok = await confirm<boolean>({
        messageKey: "team.confirmDelete",
        buttons: [
          {
            labelKey: "team.confirmDelete.ok",
            value: true,
            tone: "danger",
          },
          {
            labelKey: "team.confirmDelete.cancel",
            value: false,
            tone: "default",
          },
        ],
      });
      if (ok) {
        removeSlot(index);
      }
    },
    [confirm, removeSlot]
  );

  React.useEffect(() => {
    if (!toastText) return;
    const timer = window.setTimeout(() => setToastText(null), 1600);
    return () => window.clearTimeout(timer);
  }, [toastText]);

  React.useLayoutEffect(() => {
    const shouldAnimate = shouldAnimateReorderRef.current;
    const nextRects: Record<string, DOMRect> = {};
    slots.forEach((slot) => {
      if (!slot?.id) {
        return;
      }
      const element = slotCardRefs.current[slot.id];
      if (!element) {
        return;
      }
      const nextRect = element.getBoundingClientRect();
      nextRects[slot.id] = nextRect;
      if (!shouldAnimate) {
        return;
      }
      const previousRect = previousSlotRectsRef.current[slot.id];
      if (!previousRect) {
        return;
      }
      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        return;
      }
      element.animate(
        [
          {
            transform: `translate(${deltaX}px, ${deltaY}px)`,
          },
          {
            transform: "translate(0px, 0px)",
          },
        ],
        {
          duration: 240,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }
      );
    });
    previousSlotRectsRef.current = nextRects;
    shouldAnimateReorderRef.current = false;
  }, [slots]);

  const renderDropGap = React.useCallback(
    (gapIndex: number) => (
      <div
        key={`gap-${gapIndex}`}
        className={`team-drop-gap ${
          draggingIndex !== null ? "team-drop-gap--visible" : ""
        } ${dragOverGapIndex === gapIndex ? "team-drop-gap--active" : ""}`}
        onDragOver={(event) => {
          if (draggingIndex === null) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          if (dragOverGapIndex !== gapIndex) {
            setDragOverGapIndex(gapIndex);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleDropAtGap(gapIndex);
        }}
      />
    ),
    [dragOverGapIndex, draggingIndex, handleDropAtGap]
  );

  return (
    <>
      <div
        className={`p-team-area p-team-${isAttacker ? "attacker" : "defender"}`}
      >
        <div className="team-grid">
          <div className="team-slots-row">
            {renderDropGap(0)}
            {slots
              .map((s, i) => ({ slot: s, index: i }))
              .map(({ slot, index }) => {
              const slotKey = slot?.id ?? `empty-${index}`;
              const img = slot?.imgURL || "";
              const itemImg = slot?.itemImgURL || "";
              const isEmpty = !slot || (!slot.pasteText && !slot.imgURL);
              const selected = selectedIndex === index;
              const isDragging = draggingIndex === index;
              return (
                <React.Fragment key={slotKey}>
                  <div
                    ref={(element) => {
                      slotCardRefs.current[slotKey] = element;
                    }}
                    className={`team-slot-card ${
                      selected ? "team-slot-card--selected" : ""
                    } ${isEmpty ? "team-slot-card--empty" : ""} ${
                      isDragging ? "team-slot-card--dragging" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={`team-slot ${
                        selected ? "team-slot--selected" : ""
                      } ${isEmpty ? "team-slot--empty" : ""}`}
                      onClick={() => selectSlot(index)}
                      aria-label={""}
                      tabIndex={tabBase + 1 + index}
                      draggable={!isEmpty}
                      onDragStart={(event) => {
                        if (isEmpty) {
                          event.preventDefault();
                          return;
                        }
                        const rect = event.currentTarget.getBoundingClientRect();
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", `${index}`);
                        event.dataTransfer.setDragImage(
                          event.currentTarget,
                          rect.width / 2,
                          rect.height / 2
                        );
                        handleDragStart(index);
                      }}
                      onDragOver={(event) => {
                        if (draggingIndex === null) {
                          return;
                        }
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        const rect = event.currentTarget.getBoundingClientRect();
                        const nextGapIndex =
                          event.clientX - rect.left < rect.width / 2
                            ? index
                            : index + 1;
                        if (dragOverGapIndex !== nextGapIndex) {
                          setDragOverGapIndex(nextGapIndex);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const rect = event.currentTarget.getBoundingClientRect();
                        const nextGapIndex =
                          event.clientX - rect.left < rect.width / 2
                            ? index
                            : index + 1;
                        handleDropAtGap(nextGapIndex);
                      }}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="team-tab">
                        {img ? (
                          <img
                            className="team-slot__image"
                            src={img}
                            alt={""}
                            loading="lazy"
                            draggable={false}
                          />
                        ) : (
                          <>
                            <div className="team-slot__placeholder" />
                            <span className="team-slot__new-tag">
                              {t("team.new")}
                            </span>
                          </>
                        )}
                        {itemImg && (
                          <img
                            className="team-slot__item"
                            src={itemImg}
                            alt=""
                            loading="lazy"
                            draggable={false}
                          />
                        )}
                      </div>
                    </button>
                    {!isEmpty && (
                      <button
                        type="button"
                        className="team-slot__remove"
                        title={t("team.removePokemon")}
                        aria-label={t("team.removePokemon")}
                        onClick={() => {
                          void handleRemoveSlot(index);
                        }}
                      >
                        <FiTrash2 className="team-slot__remove-icon" />
                      </button>
                    )}
                  </div>
                  {renderDropGap(index + 1)}
                </React.Fragment>
              );
            })}
            {slots.length < 6 && (
              <div
                className="team-add"
                onClick={() => addSlot()}
                aria-label={t("team.addPokemon")}
                title={t("team.addPokemon")}
                role="button"
                tabIndex={tabBase + 20}
              >
                <FiPlus className="team-add-icon" />
              </div>
            )}
          </div>
          <div className="team-actions-col">
            <button
              type="button"
              className="team-action-button team-import"
              title={t("team.importTeam")}
              aria-label={t("team.importTeam")}
              onClick={handleImportTeam}
              tabIndex={tabBase + 22}
            >
              <FiArrowLeft />
            </button>
            <button
              type="button"
              className="team-action-button team-copy"
              title={t("team.copyTeam")}
              aria-label={t("team.copyTeam")}
              onClick={handleCopyTeam}
              tabIndex={tabBase + 21}
            >
              <FiCopy />
            </button>
          </div>
        </div>
      </div>
      {toastText &&
        createPortal(
          <div className="team-actions-toast" role="status" aria-live="polite">
            {toastText}
          </div>,
          document.body
        )}
    </>
  );
};

export default Team;
