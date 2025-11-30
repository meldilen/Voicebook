import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  useLogoutMutation,
  useGetMeQuery,
  useDeleteAccountMutation,
  useGetUserSessionsQuery,
} from "../features/auth/authApi";
import { logout, selectCurrentUser } from "../features/auth/authSlice";
import Calendar from "../features/calendar/components/MoodCalendar";
import "./ProfilePage.css";
import { useState } from "react";
import { format } from "date-fns";

const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logoutApi] = useLogoutMutation();
  const [deleteAccountApi] = useDeleteAccountMutation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState("calendar");
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);

  const { data: userData } = useGetMeQuery();

  const currentUser = userData || user;

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      dispatch(logout());
      navigate("/onboarding", { state: { fromLogout: true } });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountApi().unwrap();
      dispatch(logout());
      navigate("/onboarding", { state: { fromAccountDeletion: true } });
    } catch (err) {
      console.error("Account deletion failed:", err);
    }
  };

  const handleImageLoad = () => {
    setIsLoadingAvatar(false);
  };

  return (
    <div className="profile-page">
      <button
        className="back-button"
        onClick={() => navigate("/homepage")}
        aria-label={t("common.back")}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="profile-content">
        <header className="profile-header">
          <h1>{t("profile.title")}</h1>
          <div className="profile-actions">
            <button
              className="logout-button"
              onClick={() => setShowLogoutConfirm(true)}
              aria-label={t("profile.logout")}
            >
              {t("profile.logout")}
            </button>
          </div>
        </header>

        <div className="profile-card">
          <div className="user-info">
            <div className="avatar-container">
              {isLoadingAvatar && <div className="avatar loading"></div>}
              <img
                src={`https://ui-avatars.com/api/?name=${
                  user?.username || t("common.user")
                }&background=672f94&color=fff`}
                alt={t("common.user")}
                className={`avatar ${isLoadingAvatar ? "hidden" : ""}`}
                onLoad={handleImageLoad}
              />
            </div>
            <div className="user-details">
              <h2>{user?.username || t("common.user")}</h2>
              <p className="activity-status">
                {currentUser?.last_login
                  ? `${t("profile.userInfo.active")} ${format(
                      new Date(currentUser.last_login),
                      "MMM d, yyyy"
                    )}`
                  : `${t("profile.userInfo.joined")} ${format(
                      new Date(currentUser?.created_at),
                      "MMM d, yyyy"
                    )}`}
              </p>
            </div>
          </div>

          <div className="profile-fields">
            <div className="field">
              <label>{t("profile.userInfo.email")}</label>
              <p>{user?.email || t("profile.userInfo.noEmail")}</p>
            </div>

            {currentUser?.total_records !== undefined && (
              <div className="field">
                <label>{t("profile.stats.totalRecords")}</label>
                <p>{currentUser.total_records}</p>
              </div>
            )}

            {currentUser?.total_duration !== undefined && (
              <div className="field">
                <label>{t("profile.stats.totalDuration")}</label>
                <p>{Math.round(currentUser.total_duration / 60)} {t("profile.stats.minutes")}</p>
              </div>
            )}

            {currentUser?.consecutive_days !== undefined && (
              <div className="field">
                <label>{t("profile.stats.consecutiveDays")}</label>
                <p>{currentUser.consecutive_days} {t("profile.stats.days")}</p>
              </div>
            )}

            <button
              className="edit-button"
              onClick={() => navigate("/profile/settings")}
              aria-label={t("profile.editProfile")}
            >
              {t("profile.editProfile")}
            </button>
          </div>
        </div>

        <div className="tabs-container">
          <div className="tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "calendar"}
              className={`tab-button ${
                activeTab === "calendar" ? "active" : ""
              }`}
              onClick={() => setActiveTab("calendar")}
            >
              {t("profile.tabs.calendar")}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "sessions"}
              className={`tab-button ${
                activeTab === "sessions" ? "active" : ""
              }`}
              onClick={() => setActiveTab("sessions")}
            >
              {t("profile.tabs.stats")}
            </button>
          </div>
        </div>

        <div className="tab-content">
          {activeTab === "calendar" && (
            <div className="calendar-container">
              <Calendar />
            </div>
          )}
          {activeTab === "sessions" && (
            <div className="sessions-container">
              <SessionsList />
            </div>
          )}
        </div>
      </div>

      <button
        className="danger-zone delete-account-button"
        onClick={() => setShowDeleteConfirm(true)}
        aria-label={t("profile.deleteAccount")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t("profile.deleteAccount")}
      </button>

      {showDeleteConfirm && (
        <div className="confirmation-modal">
          <div className="modal-content delete-modal">
            <div className="modal-icon danger-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 9V12M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33977 16C2.56995 17.3333 3.53223 19 5.07183 19Z"
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>{t("profile.deleteConfirm.title")}</h3>
            <p>
              {t("profile.deleteConfirm.message")}
            </p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t("profile.deleteConfirm.cancel")}
              </button>
              <button
                className="delete-confirm-button"
                onClick={handleDeleteAccount}
              >
                {t("profile.deleteConfirm.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <p>{t("profile.logoutConfirm.message")}</p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setShowLogoutConfirm(false)}
              >
                {t("profile.logoutConfirm.cancel")}
              </button>
              <button className="logout-confirm-button" onClick={handleLogout}>
                {t("profile.logoutConfirm.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SessionsList = () => {
  const { t } = useTranslation();
  const { data: sessions } = useGetUserSessionsQuery();
  
  // Функция для определения типа устройства по user_agent
  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return { type: 'unknown', browser: 'Unknown' };
    
    const ua = userAgent.toLowerCase();
    let type = 'desktop';
    let browser = 'Unknown Browser';
    
    // Определение типа устройства
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      type = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      type = 'tablet';
    }
    
    // Определение браузера
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';
    
    return { type, browser };
  };

  // Функция для получения иконки устройства
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '🔍';
    }
  };

  // Функция для получения статуса сессии
  const getSessionStatus = (lastUsed) => {
    const now = new Date();
    const lastUsedDate = new Date(lastUsed);
    const diffHours = (now - lastUsedDate) / (1000 * 60 * 60);
    
    if (diffHours < 1) return { status: 'active', color: '#10B981', text: t('profile.sessions.status.active') };
    if (diffHours < 24) return { status: 'recent', color: '#F59E0B', text: t('profile.sessions.status.recent') };
    return { status: 'inactive', color: '#6B7280', text: t('profile.sessions.status.inactive') };
  };

  return (
    <div className="sessions-list">
      <div className="sessions-header">
        <h3>{t("profile.sessions.activeSessions")}</h3>
        <div className="sessions-count">
          {sessions?.length || 0} {t('profile.sessions.sessions')}
        </div>
      </div>
      
      {!sessions || sessions.length === 0 ? (
        <div className="no-sessions">
          <div className="no-sessions-icon">🔒</div>
          <h4>{t('profile.sessions.noSessions')}</h4>
          <p>{t('profile.sessions.noSessionsDescription')}</p>
        </div>
      ) : (
        <div className="sessions-grid">
          {sessions?.map((session, index) => {
            const deviceInfo = getDeviceInfo(session.user_agent);
            const sessionStatus = getSessionStatus(session.last_used);
            const isCurrentSession = index === 0; // Предполагаем, что первая сессия - текущая
            
            return (
              <div key={session.id} className={`session-card ${isCurrentSession ? 'current' : ''}`}>
                <div className="session-header">
                  <div className="device-info">
                    <span className="device-icon">{getDeviceIcon(deviceInfo.type)}</span>
                    <div className="device-details">
                      <span className="device-type">{deviceInfo.browser}</span>
                      <span className="device-os">{deviceInfo.type}</span>
                    </div>
                  </div>
                  <div className="session-status" style={{ color: sessionStatus.color }}>
                    <div className="status-dot" style={{ backgroundColor: sessionStatus.color }}></div>
                    {sessionStatus.text}
                  </div>
                </div>
                
                <div className="session-details">
                  <div className="detail-item">
                    <span className="detail-label">IP:</span>
                    <span className="detail-value">{session.ip_address}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('profile.sessions.lastUsed')}:</span>
                    <span className="detail-value">
                      {format(new Date(session.last_used), "MMM d, yyyy 'at' HH:mm")}
                    </span>
                  </div>
                  {session.created_at && (
                    <div className="detail-item">
                      <span className="detail-label">{t('profile.sessions.created')}:</span>
                      <span className="detail-value">
                        {format(new Date(session.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
                
                {isCurrentSession && (
                  <div className="current-session-badge">
                    {t('profile.sessions.currentSession')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;