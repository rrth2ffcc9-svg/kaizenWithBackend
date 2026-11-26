const d = (daysAgo) => new Date(Date.now() - daysAgo * 864e5).toISOString();

const base = {
  author: 'Сергей Морозов', position: 'Цех №1, оператор', department: 'Цех №1',
  problem: 'Инструмент на станках ЧПУ хранится без чёткой разметки, операторы тратят время на его поиск после смены.',
  solution: 'Нанести цветную разметку зон хранения и установить теневые панели с контурами инструмента.',
  effectValue: '−15 мин', effectNote: '/смена на поиск', savingRub: 0, comments: [],
};

export function seed() {
  return [
    { ...base, id: 'KZ-2026-200', title: 'Маркировка зон хранения инструмента на станках ЧПУ', category: '5s', status: 'new', progress: 0, createdAt: d(9), statusChangedAt: d(9), savingRub: 84000 },
    { ...base, id: 'KZ-2026-201', title: 'Маркировка зон хранения инструмента на станках ЧПУ', category: 'savings', status: 'new', progress: 0, createdAt: d(8), statusChangedAt: d(8), department: 'Цех №2', position: 'Цех №2, наладчик', author: 'Андрей Волков', savingRub: 120000 },
    { ...base, id: 'KZ-2026-202', title: 'Маркировка зон хранения инструмента на станках ЧПУ', category: 'safety', status: 'new', progress: 0, createdAt: d(6), statusChangedAt: d(6), effectValue: '−2 случая', effectNote: '/год травм', author: 'Ирина Ким', position: 'ОТК, контролёр', department: 'ОТК' },

    { ...base, id: 'KZ-2026-203', title: 'Единые стеллажи для оснастки на складе', category: '5s', status: 'review', progress: 0, createdAt: d(14), statusChangedAt: d(5), department: 'Склад', author: 'Павел Орлов', position: 'Склад, кладовщик', effectValue: '−20 мин', effectNote: '/смена на выдачу' },
    { ...base, id: 'KZ-2026-204', title: 'Переход на многоразовую тару при транспортировке заготовок', category: 'savings', status: 'review', progress: 0, createdAt: d(12), statusChangedAt: d(4), effectValue: '−36 тыс. ₽', effectNote: '/квартал', savingRub: 36000 },
    { ...base, id: 'KZ-2026-205', title: 'Защитное ограждение зоны подачи заготовок', category: 'safety', status: 'review', progress: 0, createdAt: d(11), statusChangedAt: d(3), department: 'Цех №2', author: 'Андрей Волков', position: 'Цех №2, наладчик', effectValue: '−1 риск', effectNote: '/участок' },

    { ...base, id: 'KZ-2026-206', title: 'Маркировка зон хранения инструмента на станках ЧПУ', category: '5s', status: 'progress', progress: 99, createdAt: d(30), statusChangedAt: d(3) },
    { ...base, id: 'KZ-2026-207', title: 'Сокращение переналадки на линии упаковки', category: 'savings', status: 'progress', progress: 60, createdAt: d(28), statusChangedAt: d(2), department: 'Цех №2', author: 'Андрей Волков', position: 'Цех №2, наладчик', effectValue: '−25 мин', effectNote: '/переналадка', savingRub: 210000 },
    { ...base, id: 'KZ-2026-208', title: 'Сигнальная разметка проездов для погрузчиков', category: 'safety', status: 'progress', progress: 35, createdAt: d(25), statusChangedAt: d(10), department: 'Склад', author: 'Павел Орлов', position: 'Склад, кладовщик', effectValue: '−1 инцидент', effectNote: '/квартал' },

    { ...base, id: 'KZ-2026-209', title: 'Маркировка зон хранения инструмента на станках ЧПУ', category: '5s', status: 'done', progress: 100, createdAt: d(50), statusChangedAt: d(6), doneAt: d(6), savingRub: 96000 },
    { ...base, id: 'KZ-2026-210', title: 'Автоматизация ежедневного отчёта по браку', category: 'quality', status: 'done', progress: 100, createdAt: d(45), statusChangedAt: d(20), doneAt: d(20), department: 'ОТК', author: 'Ирина Ким', position: 'ОТК, контролёр', effectValue: '−40 мин', effectNote: '/день', savingRub: 150000 },
    { ...base, id: 'KZ-2026-211', title: 'Шаблоны чек-листов приёмки материалов', category: 'quality', status: 'done', progress: 100, createdAt: d(60), statusChangedAt: d(40), doneAt: d(40), department: 'ОТК', author: 'Ирина Ким', position: 'ОТК, контролёр', effectValue: '−12% брака', effectNote: '/месяц', savingRub: 64000 },
  ];
}
