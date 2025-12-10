import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import "./Settings.css";
import {
  FiSettings,
  FiGlobe,
  FiChevronLeft,
  FiCheck,
  FiSun,
  FiMoon,
  FiType,
  FiFlag,
  FiDisc,
  FiGithub,
  FiAlertCircle,
} from "react-icons/fi";

const Settings: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabBase = 0;

  const languages = [
    { code: "en", name: t("languageEnglishName"), icon: <FiType /> },
    { code: "zh", name: t("languageChineseName"), icon: <FiFlag /> },
    { code: "ja", name: t("languageJapaneseName"), icon: <FiDisc /> },
  ];

  const themes = [
    { code: "light", name: t("lightMode"), icon: <FiSun /> },
    { code: "dark", name: t("darkMode"), icon: <FiMoon /> },
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  const changeTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="st-settings" ref={dropdownRef}>
      {/* <div className="st-header-link-old-version-container">
        <a
          href="https://pokestats.top/calc/oldVersion/"
          target="_blank"
          rel="noopener noreferrer"
          className="st-external-links"
          aria-label={t("pokemon.olderVersionEntry")}
          tabIndex={tabBase + 2}
        >
          <span className="st-calculator-icon"><FiLink /></span>
          <span className="st-external-link-text">{t("pokemon.olderVersionEntry")}</span>
        </a>
      </div> */}
      <a
        href="https://github.com/radiantwf/vgc-damage-calc/issues"
        target="_blank"
        rel="noopener noreferrer"
        className="st-icon-link"
        aria-label={t("reportBug")}
      >
        <FiAlertCircle className="st-gear-icon" />
      </a>
      <a
        href="https://github.com/radiantwf/vgc-damage-calc.git"
        target="_blank"
        rel="noopener noreferrer"
        className="st-icon-link"
        aria-label={t("githubRepo")}
      >
        <FiGithub className="st-gear-icon" />
      </a>
      <button
        className="st-gear-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("settings")}
        tabIndex={tabBase + 1}
      >
        <FiSettings className="st-gear-icon" />
      </button>

      {isOpen && (
        <div
          className="st-settings-dropdown"
          onMouseLeave={() => setActiveSubmenu(null)}
        >
          <div className="st-settings-header">
            <h3 className="st-settings-title">{t("settings")}</h3>
          </div>

          <div
            className={`st-settings-item ${
              activeSubmenu === "language" ? "st-item-active" : ""
            }`}
            onMouseEnter={() => setActiveSubmenu("language")}
          >
            <div className="st-item-icon">
              <FiGlobe />
            </div>
            <span className="st-item-text">{t("switchLanguage")}</span>
            <FiChevronLeft className="st-arrow-icon" />

            {activeSubmenu === "language" && (
              <div className="st-submenu">
                {languages.map((lang, idx) => (
                  <div
                    key={lang.code}
                    className={`st-submenu-item ${
                      i18n.language === lang.code
                        ? "st-submenu-item-active"
                        : ""
                    }`}
                    onClick={() => changeLanguage(lang.code)}
                    tabIndex={tabBase + 20 + idx}
                  >
                    <div className="st-submenu-left">
                      <span className="st-submenu-leading-icon">
                        {lang.icon}
                      </span>
                      <span className="st-submenu-text">{lang.name}</span>
                    </div>
                    <div className="st-submenu-right">
                      {i18n.language === lang.code ? (
                        <FiCheck className="st-check-icon" />
                      ) : (
                        <span
                          className="st-check-icon-placeholder"
                          aria-hidden="true"
                        ></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className={`st-settings-item ${
              activeSubmenu === "theme" ? "st-item-active" : ""
            }`}
            onMouseEnter={() => setActiveSubmenu("theme")}
          >
            <div className="st-item-icon">
              {theme === "dark" ? <FiMoon /> : <FiSun />}
            </div>
            <span className="st-item-text">{t("theme")}</span>
            <FiChevronLeft className="st-arrow-icon" />

            {activeSubmenu === "theme" && (
              <div className="st-submenu">
                {themes.map((themeOption, idx) => (
                  <div
                    key={themeOption.code}
                    className={`st-submenu-item ${
                      theme === themeOption.code ? "st-submenu-item-active" : ""
                    }`}
                    onClick={() =>
                      changeTheme(themeOption.code as "light" | "dark")
                    }
                    tabIndex={tabBase + 40 + idx}
                  >
                    <div className="st-submenu-left">
                      <span className="st-submenu-leading-icon">
                        {themeOption.icon}
                      </span>
                      <span className="st-submenu-text">
                        {themeOption.name}
                      </span>
                    </div>
                    <div className="st-submenu-right">
                      {theme === themeOption.code ? (
                        <FiCheck className="st-check-icon" />
                      ) : (
                        <span
                          className="st-check-icon-placeholder"
                          aria-hidden="true"
                        ></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
