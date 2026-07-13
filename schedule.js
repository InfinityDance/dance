// schedule.js

// URL вашего веб-приложения (получен на шаге 2)
const API_URL = 'https://script.google.com/macros/s/AKfycbx1cPQkyROmsfsQBHR_yaoyPnWz6g9Woz1PXg2HH_GRwexWYUXTdepC7fECPbNFMr4Kjg/exec';

// Функция для преобразования даты/времени в строку "ЧЧ:ММ"
function formatTimeFromDate(dateString) {
    if (!dateString) return '';
    if (/^\d{2}:\d{2}$/.test(dateString)) return dateString;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return '';
    }
}

// Функция для преобразования даты в формат "DD.MM"
function formatDateToDDMM(dateString) {
    if (!dateString) return '';
    // Если уже строка вида "13.07" — возвращаем как есть
    if (/^\d{2}\.\d{2}$/.test(dateString)) return dateString;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}.${month}`;
    } catch (e) {
        return '';
    }
}

async function loadSchedule() {
    const status = document.getElementById('schedule-status');
    if (status) status.textContent = 'Загрузка...';
    console.log('1. loadSchedule вызвана');

    try {
        console.log('2. Начинаем fetch по адресу:', API_URL);
        const response = await fetch(API_URL);
        console.log('3. Ответ получен, статус:', response.status);
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
        const data = await response.json();
        console.log('4. Данные из таблицы:', data);
        renderSchedule(data);
        if (status) status.textContent = '';
    } catch (error) {
        console.error('5. Ошибка загрузки:', error);
        if (status) status.textContent = 'Не удалось загрузить расписание. Попробуйте позже.';
    }
}

function renderSchedule(data) {
    console.log('6. renderSchedule вызвана с данными:', data);
    const tbody = document.querySelector('#dynamic-schedule tbody');
    if (!tbody) {
        console.error('Таблица не найдена');
        return;
    }
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        console.log('7. Данных нет, выводим сообщение');
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 8;
        cell.textContent = 'Нет данных о занятиях';
        return;
    }

    // ========== НОВЫЙ БЛОК: собираем даты для заголовков ==========
    const dateMap = {};
    data.forEach(item => {
        // Пытаемся найти день и дату (регистронезависимо)
        const day = item.Day || item.day || '';
        const dateVal = item.Date || item.date || '';
        if (day && dateVal && !dateMap[day]) {
            const formatted = formatDateToDDMM(dateVal);
            if (formatted) {
                dateMap[day] = formatted;
            }
        }
    });
    console.log('Даты для дней:', dateMap);

    // Обновляем заголовки
    const dayHeaders = document.querySelectorAll('#dynamic-schedule thead th .date');
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    dayHeaders.forEach((span, index) => {
        const day = daysOfWeek[index];
        if (day && dateMap[day]) {
            span.textContent = dateMap[day];
        } else {
            // Если дата не найдена, оставляем старый текст или ставим "??"
            // Можно ничего не менять, чтобы сохранить статичные даты
            // или заменить на "??" для наглядности
            if (!span.textContent || span.textContent === '') {
                span.textContent = '??';
            }
        }
    });
    // ========== КОНЕЦ НОВОГО БЛОКА ==========

    console.log('8. Данные есть, строим карту');
    const lessonMap = {};
    data.forEach(item => {
        console.log('   Обрабатываем элемент:', item);
        const day = item.Day || item.day || '';
        let time = '';
        if (item.Time) {
            time = formatTimeFromDate(item.Time);
        } else if (item.time) {
            time = formatTimeFromDate(item.time);
        }
        if (!day || !time) {
            console.log('   Пропускаем, нет Day или Time');
            return;
        }
        const key = `${day}|${time}`;
        lessonMap[key] = {
            lesson: item.Lesson || item.lesson || '',
            teacher: item.Teacher || item.teacher || '',
            booked: item.Booked || item.booked || 0,
            total: item.Total || item.total || 10
        };
    });
    console.log('9. lessonMap построена:', lessonMap);

    // Обратите внимание: дни недели уже определены выше
    const times = [];
    for (let hour = 9; hour <= 21; hour++) {
        const h = String(hour).padStart(2, '0');
        times.push(`${h}:00`);
    }

    console.log('10. Начинаем строить строки таблицы');
    times.forEach(time => {
        const row = tbody.insertRow();
        const timeCell = row.insertCell();
        timeCell.className = 'time-col';
        const nextHour = String(Number(time.split(':')[0]) + 1).padStart(2, '0');
        timeCell.textContent = `${time} – ${nextHour}:00`;

        daysOfWeek.forEach(day => {
            const cell = row.insertCell();
            const key = `${day}|${time}`;
            const lesson = lessonMap[key];

            if (lesson) {
                cell.className = 'lesson-cell';
                cell.innerHTML = `
                    ${lesson.lesson}
                    <span class="teacher">${lesson.teacher}</span>
                    <span class="count">${lesson.booked}/${lesson.total}</span>
                `;
            } else {
                cell.className = 'empty-cell';
                cell.textContent = '—';
            }
        });
    });
    console.log('11. Таблица построена');
}

document.addEventListener('DOMContentLoaded', loadSchedule);
