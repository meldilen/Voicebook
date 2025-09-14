import { Link, useLocation } from "react-router-dom";
import {
  FaUser,
  FaCalendarAlt,
  FaMicrophone,
  FaChartLine,
  FaBook,
} from "react-icons/fa";
import "./Header.css";
import { useNavigate } from "react-router-dom";
import { useGetConsecutiveDaysQuery } from "../recordings/recordingsApi";
import { selectCurrentUser } from "../auth/authSlice";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../app/LanguageSwitcher";

function Header({ onCalendarToggle }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/homepage";
  const isJournalPage = location.pathname === "/journal";

  const currentUser = useSelector(selectCurrentUser);

  const { data: streakData } = useGetConsecutiveDaysQuery(currentUser?.ID, {
    skip: !currentUser?.ID,
  });

  const streakDays = streakData?.data?.consecutive_days || 1;

  return (
    <header
      className={`sticky-header ${
        isHomePage || isJournalPage ? "transparent" : ""
      }`}
    >
      <div className="header-content">
        <LanguageSwitcher />
        
        {isHomePage || isJournalPage ? (
          <div className="home-header-nav">
            <div className="nav-group left-group">
              {isHomePage && (
                <div
                  className="nav-box calendar"
                  onClick={() => onCalendarToggle()}
                  title={t("header.calendar")}
                >
                  <FaCalendarAlt className="icon" />
                  <span className="nav-label">{t("header.calendar")}</span>
                </div>
              )}

              <div
                className="nav-box profile"
                onClick={() => navigate("/profile")}
                title={t("header.profile")}
              >
                <FaUser className="icon" />
                <span className="nav-label">{t("header.profile")}</span>
              </div>
            </div>

            <div className="nav-group right-group">
              <div
                className="nav-box home"
                onClick={() =>
                  navigate(isJournalPage ? "/homepage" : "/journal")
                }
                title={isJournalPage ? t("header.record") : t("header.journal")}
              >
                {isJournalPage ? (
                  <>
                    <FaMicrophone className="icon" />
                    <span className="nav-label">{t("header.record")}</span>
                  </>
                ) : (
                  <>
                    <FaBook className="icon" />
                    <span className="nav-label">{t("header.journal")}</span>
                  </>
                )}
              </div>

              <div className="nav-box progress" title={t("header.progress")}>
                <div className="progress-content">
                  <FaChartLine className="icon" />
                  <span className="progress-text">{t("header.day")} </span>
                  {streakDays > 0 && (
                    <span className="streak-badge">{streakDays}🔥</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="login-btn">
              <span className="login-text">{t("header.login")}</span>
              <FaUser className="login-icon" />
            </Link>
            <Link to="/signup" className="signup-btn">
              {t("header.signUp")}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;