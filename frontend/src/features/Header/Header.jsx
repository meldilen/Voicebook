import { Link, useLocation } from "react-router-dom";
import {
  FaUser,
  FaCalendarAlt,
  FaMicrophone,
  FaChartLine,
  FaBook,
  FaBars,
  FaCoins,
} from "react-icons/fa";
import "./Header.css";
import { useNavigate } from "react-router-dom";
import { useGetConsecutiveDaysQuery } from "../recordings/recordingsApi";
import { selectCurrentUser } from "../auth/authSlice";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

function Header({
  onCalendarToggle,
  availableRecordings = 5,
  emocoinsBalance = 150,
  onBottomSheetToggle,
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  const isHomePage = location.pathname === "/homepage";
  const isJournalPage = location.pathname === "/journal";

  const currentUser = useSelector(selectCurrentUser);

  const { data: streakData } = useGetConsecutiveDaysQuery(currentUser?.ID, {
    skip: !currentUser?.ID,
  });

  const streakDays = streakData?.data?.consecutive_days || 1;

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return (
    <header
      className={`sticky-header ${
        isHomePage || isJournalPage ? "transparent" : ""
      }`}
    >
      <div className="header-content">
        {isHomePage || isJournalPage ? (
          <div className={`home-header-nav ${isMobile ? "mobile-nav" : ""}`}>
            {isMobile ? (
              <>
                <div className="nav-group left-group">
                  <div
                    className="nav-box menu"
                    onClick={onBottomSheetToggle}
                    title={t("header.menu")}
                  >
                    <FaBars className="icon" />
                    <span className="nav-label">{t("header.menu")}</span>
                  </div>
                  <div
                    className="nav-box progress"
                    title={t("header.progress")}
                  >
                    <div className="progress-content">
                      <FaChartLine className="icon" />
                      <span className="progress-text">{t("header.day")} </span>
                      {streakDays > 0 && (
                        <span className="streak-badge">{streakDays}🔥</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="nav-group right-group">
                  <div className="nav-box" title="Баланс эмокоинов">
                    <FaCoins className="icon" />
                    <span className="mobile-value">{emocoinsBalance}</span>
                  </div>

                  <div className="nav-box" title="Доступные записи">
                    <FaMicrophone className="icon" />
                    <span className="mobile-value">
                      {availableRecordings}/5
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
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

                  <div
                    className="nav-box home"
                    onClick={() =>
                      navigate(isJournalPage ? "/homepage" : "/journal")
                    }
                    title={
                      isJournalPage ? t("header.record") : t("header.journal")
                    }
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
                </div>

                <div className="nav-group right-group">
                  <div
                    className="nav-box progress"
                    title={t("header.progress")}
                  >
                    <div className="progress-content">
                      <FaChartLine className="icon" />
                      <span className="progress-text">{t("header.day")} </span>
                      {streakDays > 0 && (
                        <span className="streak-badge">{streakDays}🔥</span>
                      )}
                    </div>
                  </div>

                  <div className="nav-box" title="Баланс эмокоинов">
                    <FaCoins className="icon" />
                    <span className="nav-label">{emocoinsBalance}</span>
                  </div>

                  <div className="nav-box" title="Доступные записи">
                    <FaMicrophone className="icon" />
                    <span className="nav-label">{availableRecordings}/5</span>
                  </div>
                </div>
              </>
            )}
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
