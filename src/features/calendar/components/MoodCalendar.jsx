import React from "react";
import { useState, useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./MoodCalendar.css";
import DayPopup from "./DayPopup";
import { MoodIcon } from "./MoodIcon";
import { useGetCalendarMonthQuery, useGetCalendarDayQuery } from "../calendarApi";
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
  const month = currentDate.getMonth(); // Изменено: используем 0-based месяц

  const { 
    data: calendarData = [], 
    isLoading: calendarLoading,
  } = useGetCalendarMonthQuery(
    { year, month: month + 1 }, // API ожидает 1-based месяц
    { 
      skip: !token,
      refetchOnMountOrArgChange: true
    }
  );

  // Запрос детальной информации при выборе дня
  const { 
    data: selectedDayDetail,
    isLoading: dayDetailLoading,
  } = useGetCalendarDayQuery(
    { date: selectedDate },
    { skip: !selectedDate || !token }
  );

  // Преобразуем данные в удобный формат с useMemo
  const dailyData = useMemo(() => {
    if (!calendarData) return {};
    
    return calendarData.reduce((acc, day) => {
      try {
        // Безопасное извлечение дня из даты
        const dateStr = day.date;
        let dayNumber;
        
        if (typeof dateStr === 'string') {
          // Парсим строку даты в формате "YYYY-MM-DD"
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            dayNumber = dateObj.getDate();
          } else {
            // Альтернативный парсинг
            const parts = dateStr.split('-');
            if (parts.length >= 3) {
              dayNumber = parseInt(parts[2], 10);
            }
          }
        } else if (day.date instanceof Date) {
          dayNumber = day.date.getDate();
        }
        
        if (dayNumber && !isNaN(dayNumber)) {
          acc[dayNumber] = {
            mood: day.dominant_emotion,
            summary: day.daily_summary,
            recordsCount: day.records_count,
            hasRecords: day.has_records || day.records_count > 0
          };
        }
      } catch (error) {
        console.error('Error processing day data:', error, day);
      }
      return acc;
    }, {});
  }, [calendarData]);

  // Используем старую проверенную конструкцию для дней
  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7; // Понедельник как первый день недели
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // Последний день месяца

  const calendarDays = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthName = currentDate.toLocaleString(i18n.language, { 
    month: "long",
    year: "numeric"
  });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const handleDayClick = (day) => {
    if (day) {
      // Создаем дату правильно
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      console.log('Selected date:', formattedDate, 'Day:', day, 'Month:', month);
      setSelectedDate(formattedDate);
    }
  };

  const changeMonth = async (increment) => {
    if (calendarLoading) return;
    
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

  const isToday = (day) => {
    if (!day) return false;
    const cellDate = new Date(year, month, day);
    return cellDate.toDateString() === today.toDateString();
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    try {
      // Сравниваем только день, месяц и год
      const cellDate = new Date(year, month, day);
      const selected = new Date(selectedDate);
      
      return cellDate.getDate() === selected.getDate() &&
             cellDate.getMonth() === selected.getMonth() &&
             cellDate.getFullYear() === selected.getFullYear();
    } catch (error) {
      console.error('Error comparing dates:', error);
      return false;
    }
  };

  // Используем детальные данные, если они есть, иначе данные из списка
  const selectedDayData = selectedDayDetail || 
    (selectedDate ? calendarData.find(day => day.date === selectedDate) : null);

  const isLoadingOverall = calendarLoading || isLoading;

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
            disabled={isLoadingOverall}
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
            disabled={isLoadingOverall}
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

      <div className={`days-grid ${isLoadingOverall ? "loading" : ""}`}>
        {calendarDays.map((day, index) =>
          isLoadingOverall ? (
            <div key={index} className="day-cell loading-skeleton" />
          ) : (
            <div
              key={index}
              className={`day-cell 
                ${isSelected(day) ? "selected" : ""}
                ${getDayData(day)?.hasRecords ? "has-note" : ""}
                ${isToday(day) ? "today" : ""}`}
              onClick={() => handleDayClick(day)}
              onKeyDown={(e) => e.key === 'Enter' && handleDayClick(day)}
              tabIndex={day ? 0 : -1}
              role="button"
              aria-label={day ? 
                getDayData(day)?.hasRecords ? 
                  `${t('calendar.dayWithRecords', { day })}. ${t('calendar.mood')}: ${getDayData(day).mood}` : 
                  `${t('calendar.dayWithoutRecords', { day })}` : 
                t('calendar.emptyDay')
              }
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
        isLoading={dayDetailLoading}
      />
    </div>
  );
};

export default MoodCalendar;