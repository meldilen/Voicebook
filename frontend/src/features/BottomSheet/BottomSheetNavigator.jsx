import React, { useState } from 'react';
import Calendar from '../calendar/components/MoodCalendar';
import './BottomSheetNavigator.css';
import AchievementsTab from '../../pages/AchievementsTab';
import JournalTab from '../../pages/JournalTab';

const BottomSheetNavigator = () => {
  const [activeTab, setActiveTab] = useState('achievements');
  
  const tabs = [
    { 
      id: 'achievements', 
      title: 'Достижения',
      icon: '🏆',
      component: <AchievementsTab />
    },
    { 
      id: 'journal', 
      title: 'Журнал', 
      icon: '📖',
      component: <JournalTab />
    },
    { 
      id: 'calendar', 
      title: 'Календарь',
      icon: '📅',
      component: <Calendar />
    },
    { 
      id: 'settings', 
      title: 'Настройки',
      icon: '⚙️',
      component: <div className="settings-view">
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-icon-wrapper">
              <span className="setting-icon">🔔</span>
            </div>
            <div className="setting-content">
              <span className="setting-title">Уведомления</span>
              <span className="setting-subtitle">Настройте push-уведомления</span>
            </div>
            <div className="setting-toggle"></div>
          </div>
          <div className="setting-item">
            <div className="setting-icon-wrapper">
              <span className="setting-icon">🌙</span>
            </div>
            <div className="setting-content">
              <span className="setting-title">Темная тема</span>
              <span className="setting-subtitle">Автоматическое переключение</span>
            </div>
            <div className="setting-toggle active"></div>
          </div>
          <div className="setting-item">
            <div className="setting-icon-wrapper">
              <span className="setting-icon">🔒</span>
            </div>
            <div className="setting-content">
              <span className="setting-title">Приватность</span>
              <span className="setting-subtitle">Управление данными</span>
            </div>
            <div className="setting-arrow">›</div>
          </div>
        </div>
      </div>
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="bottom-sheet-navigator">
      <div className="tab-navigation-wrapper">
        <div className="tab-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              
            >
              <div className="tab-button-bg"></div>
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        <div className="content-background">
          <div className="background-blob blob-1"></div>
          <div className="background-blob blob-2"></div>
          <div className="background-blob blob-3"></div>
        </div>
        
        <div 
          className="content-wrapper"
          key={activeTab}
        >
          {activeTabData.component}
        </div>
      </div>
    </div>
  );
};

export default BottomSheetNavigator;