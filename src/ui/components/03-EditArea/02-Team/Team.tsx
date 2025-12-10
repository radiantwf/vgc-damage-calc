import React from "react";
import EditAreaProps from "../Props/EditAreaProps";
import "./Team.css";
import { useTeamState } from "../../../../contexts/TeamContext";

import { useTranslation } from "react-i18next";
import { FiPlus, FiX, FiCopy, FiClipboard } from "react-icons/fi";
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
    addSlot,
    removeSlot,
    exportTeamToClipboard,
    importTeamFromClipboard,
  } = useTeamState(isAttacker);
  const { t } = useTranslation("app");
  const [toastText, setToastText] = React.useState<string | null>(null);
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

  React.useEffect(() => {
    if (!toastText) return;
    const timer = window.setTimeout(() => setToastText(null), 1600);
    return () => window.clearTimeout(timer);
  }, [toastText]);

  return (
    <>
      <div
        className={`p-team-area p-team-${isAttacker ? "attacker" : "defender"}`}
      >
        <div className="team-grid">
          {slots
            .map((s, i) => ({ slot: s, index: i }))
            .map(({ slot, index }) => {
              const img = slot?.imgURL || "";
              const isEmpty = !slot || (!slot.pasteText && !slot.imgURL);
              const selected = selectedIndex === index;
              return (
                <button
                  key={`slot-${index}`}
                  className={`team-slot ${
                    selected ? "team-slot--selected" : ""
                  } ${isEmpty ? "team-slot--empty" : ""}`}
                  onClick={() => selectSlot(index)}
                  aria-label={""}
                  tabIndex={tabBase + 1 + index}
                >
                  <div className="team-tab">
                    {img ? (
                      <img
                        className="team-slot__image"
                        src={img}
                        alt={""}
                        loading="lazy"
                      />
                    ) : (
                      <>
                        <div className="team-slot__placeholder" />
                        <span className="team-slot__new-tag">{t("team.new")}</span>
                      </>
                    )}
                    <div
                      className="team-slot__delete"
                      title={t("team.removePokemon")}
                      aria-label={t("team.removePokemon")}
                      onClick={(e) => {
                        e.stopPropagation();
                        void (async () => {
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
                          if (ok) removeSlot(index);
                        })();
                      }}
                    >
                      <FiX className="team-slot__delete-icon" />
                    </div>
                  </div>
                </button>
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
          <div className="team-actions-col">
            <span
              className="team-action-icon team-copy"
              title={t("team.copyTeam")}
              aria-label={t("team.copyTeam")}
              role="button"
              onClick={handleCopyTeam}
              tabIndex={tabBase + 21}
            >
              <FiCopy />
              <span className="team-action-icon__badge">{t("team.all")}</span>
            </span>
            <span
              className="team-action-icon team-import"
              title={t("team.importTeam")}
              aria-label={t("team.importTeam")}
              role="button"
              onClick={handleImportTeam}
              tabIndex={tabBase + 22}
            >
              <FiClipboard />
              <span className="team-action-icon__badge">{t("team.all")}</span>
            </span>
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
