import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./MoodCalendar.css";
import DayPopup from "./DayPopup";
import { MoodIcon } from "./MoodIcon";
import { useGetCalendarMonthQuery } from "../calendarApi";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

const MoodCalendar = () => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t, i18n } = useTranslation();

  const token = useSelector((state) => state.auth.token);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // Месяцы с 1 до 12

  // Получаем данные календаря за месяц
  const { 
    data: calendarData = [], 
    isLoading: calendarLoading
  } = useGetCalendarMonthQuery(
    { year, month },
    { skip: !token }
  );

  // Преобразуем данные в удобный формат
  const dailyData = calendarData.reduce((acc, day) => {
    const date = new Date(day.date);
    const dayNumber = date.getDate();
    acc[dayNumber] = {
      mood: day.dominant_emotion,
      summary: day.daily_summary,
      recordsCount: day.records_count,
      hasRecords: day.has_records
    };
    return acc;
  }, {});

  const firstDay = new Date(year, month - 1, 1);
  const startDay = (firstDay.getDay() + 6) % 7; // Начинаем с понедельника
  const daysInMonth = new Date(year, month, 0).getDate();

  const calendarDays = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Локализация названия месяца
  const monthName = currentDate.toLocaleString(i18n.language, { 
    month: "long",
    year: "numeric"
  });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const handleDayClick = (day) => {
    if (day) {
      const selectedDate = new Date(year, month - 1, day);
      setSelectedDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const changeMonth = (increment) => {
    setIsLoading(true);
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
    setSelectedDate(null);
    setTimeout(() => setIsLoading(false), 300);
  };

  const getDayData = (day) => {
    return dailyData[day] || null;
  };

  const selectedDayData = selectedDate ? 
    calendarData.find(day => day.date === selectedDate) : null;

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
            disabled={calendarLoading}
          >
            <FaChevronLeft />
          </button>
          <h2 className="month-year-display">
            {capitalizedMonthName}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="nav-button"
            aria-label={t("calendar.nextMonth")}
            disabled={calendarLoading}
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

      <div className={`days-grid ${isLoading || calendarLoading ? "loading" : ""}`}>
        {calendarDays.map((day, index) =>
          isLoading || calendarLoading ? (
            <div key={index} className="day-cell loading-skeleton" />
          ) : (
            <div
              key={index}
              className={`day-cell ${selectedDate && day === new Date(selectedDate).getDate() ? "selected" : ""} ${
                getDayData(day)?.hasRecords ? "has-note" : ""
              } ${day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear() ? "today" : ""}`}
              onClick={() => handleDayClick(day)}
              tabIndex={day ? 0 : -1}
            >
              {day && <span className="day-number">{day}</span>}
              {getDayData(day)?.hasRecords ? (
                <div className="mood-emoji-main">
                  <MoodIcon mood={getDayData(day).mood} />
                </div>
              ) : (
                day && <div className="empty-day"></div>
              )}
            </div>
          )
        )}
      </div>

      <DayPopup
        selectedDate={selectedDate}
        dayData={selectedDayData}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
};

export default MoodCalendar;