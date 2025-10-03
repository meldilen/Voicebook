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
      color: '#7c3aed',
      component: <AchievementsTab />
    },
    { 
      id: 'journal', 
      title: 'Журнал', 
      icon: '📖',
      color: '#10b981',
      component: <JournalTab />
    },
    { 
      id: 'calendar', 
      title: 'Календарь',
      icon: '📅',
      color: '#f59e0b',
      component: <Calendar />
    },
    { 
      id: 'settings', 
      title: 'Настройки',
      icon: '⚙️',
      color: '#6b7280',
      component: <div className="settings-view">
        <div className="settings-list">
          <div className="setting-item">
            <span className="setting-icon">🔔</span>
            <span>Уведомления</span>
          </div>
          <div className="setting-item">
            <span className="setting-icon">🌙</span>
            <span>Темная тема</span>
          </div>
          <div className="setting-item">
            <span className="setting-icon">🔒</span>
            <span>Приватность</span>
          </div>
        </div>
      </div>
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="bottom-sheet-navigator">
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--active-color': tab.color }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.title}</span>
            <div className="tab-indicator"></div>
          </button>
        ))}
      </div>

      <div className="tab-content">
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