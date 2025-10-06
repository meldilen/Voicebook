import { useState, useEffect } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "./MoodCalendar.css";
import DayPopup from "./DayPopup";
import { MoodIcon } from "./MoodIcon";
import { useGetTotalsQuery } from "../totalApi";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

const Calendar = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [dailyData, setDailyData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { t, i18n } = useTranslation();

  const userId = useSelector((state) => state.auth.user?.ID);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startDate = new Date(year, month, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const { data: response, refetch } = useGetTotalsQuery(
    { userId, startDate, endDate },
    { skip: !userId }
  );

  useEffect(() => {
    if (userId) {
      refetch();
    }
  }, [userId, refetch]);

  useEffect(() => {
    if (response?.success && response.data) {
      const transformedData = {};
      response.data.forEach((day) => {
        const dayNumber = new Date(day.date).getDate();
        transformedData[dayNumber] = {
          mood: day.emotion,
          summary: day.summary,
        };
        console.log(day.emotion, day.summary);
      });
      setDailyData(transformedData);
    } else {
      setDailyData({});
    }
  }, [response]);

  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Локализация названия месяца с большой буквы
  const monthName = currentDate.toLocaleString(i18n.language, { month: "long" });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const handleDayClick = (day) => {
    if (day) {
      setSelectedDay(day);
    }
  };

  const changeMonth = (increment) => {
    setIsLoading(true);
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
    setSelectedDay(null);
    setTimeout(() => setIsLoading(false), 300);
  };

  const currentDayData = selectedDay ? dailyData[selectedDay] : null;

  return (
    <div className="calendar-wrapper">
      <div className="gradient-ball" />
      <div className="gradient-ball-2" />
      <div className="gradient-ball-3" />
      <div className="gradient-ball-4" />

      <div className="calendar-header">
        <div className="month-navigation">
          <button
            onClick={() => changeMonth(-1)}
            className="nav-button"
            aria-label={t("calendar.previousMonth")}
          >
            <FaChevronLeft />
          </button>
          <h2 className="month-year-display">
            {capitalizedMonthName} {year}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="nav-button"
            aria-label={t("calendar.nextMonth")}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className="day-names">
        {t("calendar.dayNames", { returnObjects: true }).map((name, i) => (
          <div key={i} className="day-name">
            {name}
          </div>
        ))}
      </div>

      <div className={`days-grid ${isLoading ? "loading" : ""}`}>
        {calendarDays.map((day, index) =>
          isLoading ? (
            <div key={index} className="day-cell loading-skeleton" />
          ) : (
            <div
              key={index}
              className={`day-cell ${day === selectedDay ? "selected" : ""} ${
                dailyData[day] ? "has-note" : ""
              }`}
              onClick={() => handleDayClick(day)}
              tabIndex={day ? 0 : -1}
            >
              {day && <span className="day-number">{day}</span>}
              {dailyData[day] ? (
                <div className="mood-emoji-main">
                  <MoodIcon mood={dailyData[day].mood} />
                </div>
              ) : (
                day && <div className="empty-day"></div>
              )}
            </div>
          )
        )}
      </div>

      <DayPopup
        currentDayData={currentDayData}
        selectedDay={selectedDay}
        monthName={capitalizedMonthName}
        year={year}
      />
    </div>
  );
};

export default Calendar;