// schedule.js

// URL вашего веб-приложения (получен на шаге 2)
const API_URL = 'https://script.google.com/macros/s/AKfycbzfx9jPu8Ra_ZCsfpSz11icaK80_2pw2bdgslPzqweJ1DCEeao17zYgx5fP6hIcf9Kg-w/exec';

// Функция для загрузки данных с сервера
async function loadSchedule() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const data = await response.json();
        console.log('Данные из таблицы:', data);
        renderSchedule(data);
        // Скрываем индикатор загрузки, если он есть
        const status = document.getElementById('schedule-status');
        if (status) status.textContent = '';
    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
        const status = document.getElementById('schedule-status');
        if (status) status.textContent = 'Не удалось загрузить расписание. Попробуйте позже.';
    }
}

// Функция для отрисовки таблицы (здесь ваша логика)
function renderSchedule(data) {
    const table = document.querySelector('#dynamic-schedule tbody');
    if (!table) {
        console.error('Таблица с id="dynamic-schedule" не найдена');
        return;
    }

    // Очищаем тело таблицы
    table.innerHTML = '';

    if (!data || data.length === 0) {
        const row = table.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 8; // количество столбцов: время + 7 дней
        cell.textContent = 'Нет данных о занятиях';
        return;
    }

    // Здесь ваша сложная логика группировки по дням и времени
    // Пока просто выведем все строки для демонстрации
    data.forEach(item => {
        const row = table.insertRow();
        // Ячейка со временем
        const timeCell = row.insertCell();
        timeCell.textContent = item.time || '—';
        // Ячейка с днём
        const dayCell = row.insertCell();
        dayCell.textContent = item.day || '—';
        // Ячейка с направлением
        const dirCell = row.insertCell();
        dirCell.textContent = item.direction || '—';
        // Ячейка с преподавателем
        const teachCell = row.insertCell();
        teachCell.textContent = item.teacher || '—';
        // Ячейка со свободными местами
        const freeCell = row.insertCell();
        const total = item.total || 0;
        const booked = item.booked || 0;
        freeCell.textContent = `${booked}/${total}`;
    });
}

// Функция для отправки данных о бронировании (вызывается при записи)
async function bookLesson(day, time) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ day, time })
        });
        const result = await response.json();
        if (result.success) {
            console.log('Бронирование успешно');
            // После успешного бронирования обновляем расписание
            loadSchedule();
            // Можно также показать сообщение пользователю
            alert('Вы успешно записаны!');
        } else {
            console.error('Ошибка бронирования:', result.message);
            alert('Не удалось забронировать место. Попробуйте позже.');
        }
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        alert('Ошибка связи с сервером. Проверьте интернет.');
    }
}

// Загружаем расписание после полной загрузки страницы
document.addEventListener('DOMContentLoaded', loadSchedule);
