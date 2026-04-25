import React from "react";
import { useTranslation } from "react-i18next";
import { type ConfirmDialogProps } from "react-confirm";
import "./ConfirmDialog.css";

type ButtonTone = "primary" | "danger" | "default";

export type ConfirmButton<Response> = {
  labelKey: string;
  value: Response;
  tone?: ButtonTone;
};

export type ConfirmPayload<Response> = {
  messageKey: string;
  buttons: ConfirmButton<Response>[];
};

function ConfirmDialog<Response>(
  props: ConfirmDialogProps<ConfirmPayload<Response>, Response>
) {
  const { show, proceed, messageKey, buttons } = props;
  const { t } = useTranslation("app");

  return (
    <div
      className={`cf-dialog-overlay ${show ? "cf-show" : "cf-hide"}`}
    >
      <div className="cf-dialog" role="dialog" aria-modal="true">
        <div className="cf-dialog-message">{t(messageKey)}</div>
        <div className="cf-dialog-actions">
          {buttons.map((btn: ConfirmButton<Response>, idx: number) => (
            <button
              key={`${btn.labelKey}-${idx}`}
              className={`cf-btn ${
                btn.tone === "primary"
                  ? "cf-btn-primary"
                  : btn.tone === "danger"
                  ? "cf-btn-danger"
                  : "cf-btn-default"
              }`}
              onClick={() => proceed(btn.value)}
            >
              {t(btn.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
