/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

// web/jam/util/I18n.js

// extend default translation category
// use: <span data-t="">Some text</span>
// use: <div title="Some text"></div>
// use: <input placeholder="Some text" type="text" />

// define custom translation category
// use: <span data-t="custom">Any text</span>
// use: <div data-t="custom" title="Any text"></div>
// use: <input data-t="custom" placeholder="Any text" type="text"/>
// use: <div data-t-title="customTitle" title="Any title" data-t="custom">Any text</div>

Jam.I18n.defaults = {

    'Action completed': 'Действие завершено',
    'Action failed': 'Действие не удалось',
    'Active': 'Активен',
    'Active indexes': 'Активные индексы',
    'Add': 'Добавить',
    'Add condition': 'Добавить условие',
    'Add condition before saving': 'Добавьте условие перед сохранением',
    'Advanced search': 'Расширенный поиск',
    'Apply': 'Применить',

    'Back to modal form': 'Вернуться к модальной форме',
    'Blocked': 'Блокирован',

    'Can not restore ambiguous values': 'Не могу восстановить неоднозначные значения',
    'Cancel': 'Отменить',
    'Change password': 'Изменить пароль',
    'Clone': 'Клонировать',
    'Close': 'Закрыть',
    'Close the last modal tab': 'Закройте последнюю модальную вкладку',
    'Close without saving?': 'Закрыть без сохранения?',
    'Confirm': 'Подтвердить',
    'Confirmation': 'Подтверждение',
    'Content': 'Содержание',
    'Copy ID': 'Скопировать ID',
    'Create': 'Создать',
    'Created at': 'Создано',
    'Creator': 'Автор',

    'Data': 'Данные',
    'Data history': 'История данных',
    'Default value': 'Значение по умолчанию',
    'Delete': 'Удалить',
    'Delete absolutely all metadata?': 'Удалить абсолютно все мета-данные?',
    'Delete permanently?': 'Удалить безвозвратно?',
    'Description': 'Описание',
    'Download': 'Скачать',
    'Drop or select file here': 'Бросьте или выберите файл здесь',

    'Edit': 'Редактировать',
    'Email': 'Email',
    'Export': 'Экспортировать',

    'File': 'Файл',

    'Group': 'Группа',

    'History': 'История',

    'Import': 'Импортировать',
    'Index definitions': 'Определения индексов',
    'Index definitions not found in class:': 'Определения индексов не найдены в классе',
    'Indexing': 'Индексирование',
    'Initial data': 'Исходные данные',
    'Input ID...': 'Введите ID...',
    'Input number...': 'Введите число...',
    'Input value...': 'Введите значение...',
    'Invalid verification code': 'Неверный проверочный код',

    'Job': 'Работа',

    'Label': 'Ярлык',
    'Last done at': 'Последний раз сделано',
    'Link': 'Добавить',

    'Main': 'Главная',
    'Metadata': 'Метаданные',
    'Metadata reloaded': 'Метаданные перезагружены',
    'Modification date': 'Дата изменения',

    'Name': 'Название',
    'No': 'Нет',
    'No saved filters yet': 'Пока нет сохраненных фильтров',

    'Order': 'Порядок',
    'Order number': 'Порядковый номер',
    'Owner': 'Владелец',

    'Page size': 'Размер страницы',
    'Password': 'Пароль',
    'Preparing to upload...': 'Подготовка к выгрузке...',
    'Profile': 'Профиль',

    'Radio list': 'Радио-кнопки',
    'Rebuild': 'Перестроить',
    'Relation select box': 'Выпадающий список отношений',
    'Reload': 'Обновить',
    'Reload form': 'Перезагрузить форму',
    'Remove': 'Удалить',
    'Reset filter': 'Сбросить фильтр',
    'Restore selected values?': 'Востановить выбранные значения?',
    'Role': 'Роль',
    'Roles': 'Роли',

    'Save': 'Сохранить',
    'Save and close': 'Сохранить и закрыть',
    'Save filter': 'Сохранить фильтр',
    'Search...': 'Искать...',
    'Select': 'Выбрать',
    'Select all': 'Выбрать все',
    'Select box': 'Выпадающий список',
    'Select column to sort': 'Выберите колонку для сортировки',
    'Select date...': 'Выберите дату...',
    'Select filter': 'Выбрать фильтр',
    'Select items for action': 'Выберите объекты для действия',
    'Select one item for action': 'Выберите объект для действия',
    'Select values to restore': 'Выберите значения для восстановления',
    'Subject': 'Тема',
    'Sign in': 'Войти',
    'Sign out': 'Выйти',
    'Sort': 'Сортировать',
    'Status': 'Статус',

    'Table:': 'Таблица:',
    'Text': 'Текст',
    'Too many files': 'Слишком много файлов',
    'Type': 'Тип',

    'Unlink': 'Убрать',
    'Unlink selected items?': 'Убрать выбранные объекты?',
    'Update': 'Изменить',
    'Updated at': 'Изменено',
    'Upload completed': 'Загрузка завершена',
    'User': 'Пользователь',
    'Users': 'Пользователи',

    'Value': 'Значение',
    'View': 'Просмотр',

    'Warning': 'Предупреждение',

    'Yes': 'Да',
    'You have no new notifications': 'Нет новых уведомлений',

    'begins': 'начинается',

    'ends': 'заканчивается',

    'contains': 'содержит',

    'equal': 'равно',

    'nested': 'вложенный',
    'not equal': 'не равно',
    'not set': 'не задано'
};