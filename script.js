const themeStorageKey = 'focusflow-theme';
const taskStorageKey = 'focusflow-tasks';
const quotes = [
    'Succes is het resultaat van dagelijkse gewoontes, niet van eenmalige gigantische inspanningen. – James Clear',
    'De beste manier om vooruit te komen is om te beginnen. – Mark Twain',
    'Rust is niet het ontbreken van activiteit, maar het bewust kiezen van je aandacht.',
    'Kleine stappen in de juiste richting kunnen je grootste avontuur worden.',
    'Focus op vooruitgang, niet op perfectie.',
    'Je toekomst wordt bepaald door wat je vandaag doet, niet morgen. – Robert Kiyosaki',
    'Doe één ding op een gegeven moment en doe het goed.',
    'Elke dag is een nieuwe kans om het beter te doen dan gisteren.'
];

/**
 * Formatteert en toont de huidige datum en tijd.
 */
function updateClock() {
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const clockElement = document.getElementById('live-clock');
    const dateElement = document.getElementById('live-date');

    clockElement.textContent = timeFormatter.format(now);
    dateElement.textContent = dateFormatter.format(now);
}

/**
 * Creëert een todo-item element en voorziet het van interactie.
 */
function createTodoItem(task, tasks, listElement, saveCallback) {
    const listItem = document.createElement('li');
    listItem.className = 'todo-item';
    if (task.completed) {
        listItem.classList.add('completed');
    }

    const checkboxId = `todo-${task.id}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.checked = task.completed;
    checkbox.className = 'todo-checkbox';

    const label = document.createElement('label');
    label.className = 'task-label';
    label.htmlFor = checkboxId;
    label.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.setAttribute('aria-label', `Verwijder taak: ${task.text}`);
    deleteButton.textContent = '✕';

    checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        listItem.classList.toggle('completed', task.completed);
        saveCallback(tasks);
    });

    deleteButton.addEventListener('click', () => {
        const index = tasks.findIndex((item) => item.id === task.id);
        if (index !== -1) {
            tasks.splice(index, 1);
            listItem.remove();
            saveCallback(tasks);
        }
    });

    listItem.append(checkbox, label, deleteButton);
    listElement.appendChild(listItem);
}

/**
 * Voegt een taak toe aan de lijst en slaat de wijziging op.
 */
function addTask(tasks, text, listElement, saveCallback) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const task = {
        id: Date.now().toString(36),
        text: trimmed,
        completed: false
    };

    tasks.push(task);
    createTodoItem(task, tasks, listElement, saveCallback);
    saveCallback(tasks);
}

/**
 * Slaat de taken op in localStorage.
 */
function saveTasks(tasks) {
    localStorage.setItem(taskStorageKey, JSON.stringify(tasks));
}

function restoreTasks() {
    try {
        const raw = localStorage.getItem(taskStorageKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((task) =>
            typeof task.id === 'string' &&
            typeof task.text === 'string' &&
            typeof task.completed === 'boolean'
        );
    } catch (error) {
        console.warn('Kon taken niet herstellen:', error);
        return [];
    }
}

function updateFooterYear() {
    const footerYear = document.getElementById('footer-year');
    footerYear.textContent = new Date().getFullYear();
}

/**
 * Toont een willekeurige quote en speelt de animatie opnieuw af.
 */
function showRandomQuote() {
    const display = document.getElementById('quote-display');
    const randomIndex = Math.floor(Math.random() * quotes.length);
    display.textContent = quotes[randomIndex];

    // Start de animatie opnieuw door deze tijdelijk te verwijderen
    display.style.animation = 'none';
    void display.offsetWidth; // Forceer reflow
    display.style.animation = '';
}

function initialiseThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedPreference = localStorage.getItem(themeStorageKey);
    const body = document.body;

    const initialIsDark = storedPreference ? storedPreference === 'dark' : prefersDark;
    applyTheme(initialIsDark);

    toggle.addEventListener('click', () => {
        const isDark = !body.classList.contains('dark-theme');
        applyTheme(isDark);
    });

    function applyTheme(isDark) {
        body.classList.toggle('dark-theme', isDark);
        toggle.textContent = isDark ? '☀️ Licht' : '🌙 Donker';
        toggle.setAttribute('aria-pressed', String(isDark));
        localStorage.setItem(themeStorageKey, isDark ? 'dark' : 'light');
    }
}

function initialiseTodoList() {
    const tasks = restoreTasks();
    const listElement = document.getElementById('todo-list');
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');

    const saveCallback = (currentTasks) => saveTasks(currentTasks);

    tasks.forEach((task) => createTodoItem(task, tasks, listElement, saveCallback));

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        addTask(tasks, input.value, listElement, saveCallback);
        form.reset();
        input.focus();
    });
}

function initialiseCalculator() {
    const display = document.getElementById('calc-display');
    let expression = '0';

    const isOperator = (value) => ['+', '-', '*', '/'].includes(value);

    const updateDisplay = () => {
        display.textContent = expression;
    };

    const resetExpression = () => {
        expression = '0';
        updateDisplay();
    };

    const deleteLast = () => {
        expression = expression.length > 1 ? expression.slice(0, -1) : '0';
        updateDisplay();
    };

    const canAddDecimal = () => {
        const operators = ['+', '-', '*', '/'];
        const lastOperatorIndex = Math.max(
            ...operators.map((operator) => expression.lastIndexOf(operator))
        );
        const lastNumber = expression.slice(lastOperatorIndex + 1);
        return !lastNumber.includes('.');
    };

    const appendValue = (value) => {
        if (value === '.') {
            if (!canAddDecimal()) return;
        }

        if (isOperator(value)) {
            const lastChar = expression.slice(-1);
            if (isOperator(lastChar)) {
                expression = expression.slice(0, -1) + value;
                updateDisplay();
                return;
            }
            if (expression === '0') {
                if (value === '-') {
                    expression = value;
                    updateDisplay();
                }
                return;
            }
        }

        if (expression === '0' && !isOperator(value)) {
            expression = value;
        } else {
            expression += value;
        }
        updateDisplay();
    };

    const calculate = () => {
        try {
            let sanitized = expression;
            sanitized = sanitized.replace(/[^0-9+\-*/.]/g, '');
            sanitized = sanitized.replace(/[+\-*/.]+$/, '');
            if (!sanitized) {
                resetExpression();
                return;
            }
            const result = Function(`"use strict"; return (${sanitized});`)();
            expression = Number.isFinite(result) ? result.toString() : '0';
        } catch (error) {
            expression = '0';
        }
        updateDisplay();
    };

    document.querySelectorAll('.calculator-grid button').forEach((button) => {
        const { value } = button.dataset;
        const action = button.dataset.action;

        if (value) {
            button.addEventListener('click', () => appendValue(value));
        }

        if (action === 'clear') {
            button.addEventListener('click', resetExpression);
        }

        if (action === 'delete') {
            button.addEventListener('click', deleteLast);
        }

        if (action === 'equals') {
            button.addEventListener('click', calculate);
        }
    });
}

function initialiseQuotes() {
    const quoteButton = document.getElementById('quote-button');
    const display = document.getElementById('quote-display');

    quoteButton.addEventListener('click', showRandomQuote);

    display.textContent = 'Klik op de knop om een inspirerende quote te zien.';
}

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    updateFooterYear();

    initialiseThemeToggle();
    initialiseTodoList();
    initialiseCalculator();
    initialiseQuotes();
});
