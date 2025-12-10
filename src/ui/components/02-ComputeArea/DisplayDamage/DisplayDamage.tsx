import React, { useState, useMemo } from "react";
import "./DisplayDamage.css";
import { useDamageCompute } from "../../../../contexts/DamageComputeContext";
import { useTranslation } from "react-i18next";

interface DisplayDamageProps {
  className?: string;
}

export const DisplayDamage: React.FC<DisplayDamageProps> = ({ className }) => {
  const { isAttackerSelected, selectedResult } = useDamageCompute();
  const { t } = useTranslation(["app", "calc/damage_result"]);
  const [showSegments, setShowSegments] = useState(false);
  const hasSegments = useMemo(
    () => !!selectedResult && selectedResult.hasMultiSegmentDamage(),
    [selectedResult]
  );
  const segmentValues = useMemo(
    () => (hasSegments && selectedResult ? selectedResult.damage as number[][] : []),
    [hasSegments, selectedResult]
  );
  const arrowText = showSegments
    ? t("damageResult.expandArrowUp")
    : t("damageResult.expandArrowDown");

  return (
    <div className={`display-damage ${className || ""}`}>
      {selectedResult && selectedResult.getFullDescText() && (
        <div
          className={`display-damage__description ${
            isAttackerSelected
              ? "display-damage__description--left"
              : "display-damage__description--right"
          }`}
        >
          {selectedResult.getFullDescText()}
        </div>
      )}

      {selectedResult && selectedResult.getPossibleDamageAmountsText() && (
        <div
          className={`display-damage__amounts ${
            isAttackerSelected
              ? "display-damage__amounts--left"
              : "display-damage__amounts--right"
          }`}
          onClick={() => {
            if (hasSegments) setShowSegments((p) => !p);
          }}
        >
          {isAttackerSelected && hasSegments ? (
            <span className="display-damage__amounts-arrow">
              {arrowText}
            </span>
          ) : null}
          <span className="display-damage__amounts-label">
            {t("damageResult.possibleDamageAmounts")}:
          </span>
          <span className="display-damage__amounts-values">
            ({selectedResult.getPossibleDamageAmountsText()})
          </span>
          {!isAttackerSelected && hasSegments ? (
            <span className="display-damage__amounts-arrow">{arrowText}</span>
          ) : null}

          {showSegments && hasSegments ? (
            <>
              <br />
              {isAttackerSelected ? (
                <span className="display-damage__amounts-arrow-col" />
              ) : null}
              <span className="display-damage__segments-block">
                (
                {segmentValues
                  .map(
                    (vals, i) =>
                      `${t("damageResult.segment", { index: i + 1 })}: ${vals.join(
                        t("damageResult.chanceaftertextsplit")
                      )}`
                  )
                  .join("\n")}
                )
              </span>
              {!isAttackerSelected ? (
                <span className="display-damage__amounts-arrow-col" />
              ) : null}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};