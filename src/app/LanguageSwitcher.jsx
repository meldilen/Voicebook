import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="language-switcher"
    >
      <option value="en">EN</option>
      <option value="ru">RU</option>
    </select>
  );
};

export default LanguageSwitcher;