import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  useLogoutMutation,
  useGetMeQuery,
  useDeleteAccountMutation,
} from "../features/auth/authApi";
import { logout, selectCurrentUser } from "../features/auth/authSlice";
import Calendar from "../features/calendar/components/MoodCalendar";
import "./ProfilePage.css";
import { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logoutApi] = useLogoutMutation();
  const [deleteAccountApi] = useDeleteAccountMutation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { t } = useTranslation();

  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState("calendar");
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);

  useGetMeQuery(undefined, { skip: !user });

  const handleLogout = async () => {
    try {
      const response = await logoutApi().unwrap();
      console.log("Logout API response:", response);
      dispatch(logout());
      navigate("/onboarding", { state: { fromLogout: true } });
    } catch (err) {
      console.error("Logout failed:", {
        error: err,
        status: err.status,
        data: err.data,
        originalError: err.originalError,
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await deleteAccountApi().unwrap();
      console.log("Delete account API response:", response);
      dispatch(logout());
      navigate("/onboarding", { state: { fromAccountDeletion: true } });
    } catch (err) {
      console.error("Account deletion failed:", {
        error: err,
        status: err.status,
        data: err.data,
        originalError: err.originalError,
      });
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
        aria-label={t("profile.back")}
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
                  user?.Nickname || "User"
                }&background=672f94&color=fff`}
                alt="User"
                className={`avatar ${isLoadingAvatar ? "hidden" : ""}`}
                onLoad={handleImageLoad}
              />
            </div>
            <div className="user-details">
              <h2>{user?.Nickname || "User"}</h2>
              <p className="activity-status">
                {t("profile.userInfo.active")}
              </p>
            </div>
          </div>

          <div className="profile-fields">
            <div className="field">
              <label>{t("profile.userInfo.email")}</label>
              <p>{user?.Login || t("profile.userInfo.noEmail")}</p>
            </div>

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
          </div>
        </div>

        <div className="tab-content">
          {activeTab === "calendar" && (
            <div className="calendar-container">
              <Calendar />
            </div>
          )}
        </div>
      </div>

      <div className="danger-zone-section">
        <h3 className="danger-zone-title">{t("profile.dangerZone")}</h3>
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
      </div>

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
            <p>{t("profile.deleteConfirm.message")}</p>
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
            <h3>{t("profile.logoutConfirm.title")}</h3>
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

export default ProfilePage;