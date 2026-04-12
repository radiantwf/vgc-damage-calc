import React from "react";
import { useTranslation } from "react-i18next";
import { useFormats } from "../../../contexts/FormatsContext";
import "./FormatsWidget.css";
import SearchableDropdown, {
  DropdownItem,
} from "../../widgets/SearchableDropdown/SearchableDropdown";

interface FormatsWidgetProps {
  className?: string;
}

const FormatsWidget: React.FC<FormatsWidgetProps> = ({ className = "" }) => {
  const { t } = useTranslation();
  const tabBase = 100000;

  // 使用自定义hook获取数据和状态管理
  const {
    gameList,
    regList,
    monthTagList,
    ruleList,
    cutlineList,
    currentGame,
    currentReg,
    currentMonthTag,
    currentRule,
    currentCutline,
    setCurrentGame,
    setCurrentReg,
    setCurrentMonthTag,
    setCurrentRule,
    setCurrentCutline,
    loading,
    error,
  } = useFormats();

  const gameDropdownItems: DropdownItem[] = gameList.map((game) => ({
    key: t(`formatGame.${game}`, { defaultValue: game }),
    value: game,
    searchKey: `${game}|${t(`formatGame.${game}`, { defaultValue: game })}`,
  }));

  const regDropdownItems: DropdownItem[] = regList.map((reg) => ({
    key: reg,
    value: reg,
  }));

  const monthDropdownItems: DropdownItem[] = monthTagList.map((month) => ({
    key: month,
    value: month,
  }));

  const ruleDropdownItems: DropdownItem[] = ruleList.map((rule) => ({
    key: rule,
    value: rule,
  }));

  const cutlineDropdownItems: DropdownItem[] = cutlineList.map((cutline) => ({
    key: cutline,
    value: cutline,
  }));

  const buildDropdown = ({
    key,
    className,
    dropdownClassName,
    value,
    items,
    onChange,
    tabIndex,
  }: {
    key: string;
    className: string;
    dropdownClassName?: string;
    value?: string;
    items: DropdownItem[];
    onChange: (value: string) => void;
    tabIndex?: number;
  }) => {
    return (
      <div className={`fw-dropdown-row ${className ? className : ""}`}>
        <span className="fw-dropdown-label">{key}:</span>
        <SearchableDropdown
          items={items}
          value={value}
          onChange={(value) => onChange(value as string)}
          placeholder={`${t("search")}...`}
          className={dropdownClassName || `${className}-searchable`}
          inputClassName={`fw-dropdown-input ${className}-input`}
          dropdownClassName={`fw-dropdown-menu ${className}-menu`}
          isTextEditable={false}
          showDropdownButton={true}
          tabIndex={tabIndex}
        />
      </div>
    );
  };

  // 显示加载状态
  if (loading) {
    return (
      <div className={`formats-widget ${className ? className : ""}`}>
        <div className="loading-message">{t("loading")}...</div>
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div className={`formats-widget ${className ? className : ""}`}>
        <div className="error-message">
          {t("error")}: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`formats-widget ${className ? className : ""}`}>
      <div className="fw-formats-row">
        {buildDropdown({
          key: t("game"),
          className: "fw-game-dropdown",
          value: currentGame,
          items: gameDropdownItems,
          onChange: (value) => setCurrentGame(value || undefined),
          tabIndex: tabBase + 1,
        })}

        {buildDropdown({
          key: t("reg"),
          className: "fw-reg-dropdown",
          value: currentReg,
          items: regDropdownItems,
          onChange: (value) => setCurrentReg(value || undefined),
          tabIndex: tabBase + 2,
        })}

        {buildDropdown({
          key: t("month"),
          className: "fw-month-dropdown",
          value: currentMonthTag,
          items: monthDropdownItems,
          onChange: (value) => setCurrentMonthTag(value || undefined),
          tabIndex: tabBase + 3,
        })}

        {buildDropdown({
          key: t("rule"),
          className: "fw-rule-dropdown",
          value: currentRule,
          items: ruleDropdownItems,
          onChange: (value) => setCurrentRule(value || undefined),
          tabIndex: tabBase + 4,
        })}

        {buildDropdown({
          key: t("cutline"),
          className: "fw-cutline-dropdown",
          value: currentCutline,
          items: cutlineDropdownItems,
          onChange: (value) => setCurrentCutline(value || undefined),
          tabIndex: tabBase + 5,
        })}
      </div>
    </div>
  );
};

export default FormatsWidget;
