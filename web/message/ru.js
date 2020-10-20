/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

// web/jam/other/I18n.js

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

    'B': 'Б',
    'KiB': 'Кб',
    'MiB': 'Мб',
    'GiB': 'Гб',
    'TiB': 'Тб',

    'Access denied': 'Доступ запрещен',
    'Account': 'Аккаунт',
    'Action completed': 'Действие завершено',
    'Action failed': 'Действие не удалось',
    'Active': 'Активен',
    'Active indexes': 'Активные индексы',
    'Add': 'Добавить',
    'Add condition': 'Добавить условие',
    'Add condition to save': 'Добавьте условие для сохранения',
    'Administration': 'Администрирование',
    'Advanced search': 'Расширенный поиск',
    'All notifications': 'Все уведомления',
    'Apply': 'Применить',

    'Back to modal': 'Вернуться к модальному окну',
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
    'Create file': 'Создать файл',
    'Create new object': 'Создать новый объект',
    'Created at': 'Создано',
    'Creator': 'Автор',
    'Customize columns': 'Настроить колонки',

    'Data': 'Данные',
    'Data does not match condition': 'Данные не соответствуют условию',
    'Data history': 'История данных',
    'Default value': 'Значение по умолчанию',
    'Delete': 'Удалить',
    'Delete absolutely all metadata?': 'Удалить абсолютно все мета-данные?',
    'Delete object': 'Удалить объект',
    'Delete selected objects permanently?': 'Удалить выбранные объекты безвозвратно?',
    'Delete this object permanently?': 'Удалить объект безвозвратно?',
    'Description': 'Описание',
    'Download': 'Скачать',
    'Drop or select file here': 'Выберите или бросьте файл здесь',

    'Edit': 'Редактировать',
    'Email': 'Email',
    'Export': 'Экспортировать',

    'File': 'Файл',
    'File is not an image': 'Файл не является изображением',
    'File size cannot be smaller than {limit}': 'Размер файла не может быть менее {limit}',
    'File size cannot exceed {limit}': 'Размер файла не может превышать {limit}',
    'Front': 'Фронт',

    'Group': 'Группа',

    'History': 'История',
    'Home': 'Домой',
    'Homepage': 'Стартовая страница',

    'Import': 'Импортировать',
    'Index definitions': 'Определения индексов',
    'Index definitions not found in class:': 'Определения индексов не найдены в классе',
    'Indexing': 'Индексирование',
    'Initial data': 'Исходные данные',
    'Input ID...': 'Введите ID...',
    'Input number...': 'Введите число...',
    'Input value...': 'Введите значение...',
    'Invalid class file': 'Неверный файл класса',
    'Invalid verification code': 'Неверный проверочный код',

    'Job': 'Работа',

    'Label': 'Ярлык',
    'Last done at': 'Последний раз сделано',
    'Link': 'Добавить',

    'Metadata': 'Метаданные',
    'Modification date': 'Дата изменения',

    'Name': 'Название',
    'No': 'Нет',
    'No saved filters yet': 'Пока нет сохраненных фильтров',
    'Notifications': 'Уведомления',

    'Object select box': 'Выпадающий список объектов',
    'Office': 'Офис',
    'Only these file extensions are allowed: {extensions}': 'Допустимы только эти расширения файлов: {extensions}',
    'Only these file MIME types are allowed: {mimeTypes}': 'Допустимы только эти MIME-типы файлов: {mimeTypes}',
    'Order': 'Порядок',
    'Order number': 'Порядковый номер',
    'Owner': 'Владелец',

    'Page size': 'Размер страницы',
    'Password': 'Пароль',
    'Preparing to upload...': 'Подготовка к выгрузке...',
    'Profile': 'Профиль',

    'Radio list': 'Радио-кнопки',
    'Rebuild': 'Перестроить',
    'Reload': 'Обновить',
    'Reload form': 'Перезагрузить форму',    
    'Remove': 'Убрать',
    'Remove from related objects': 'Убрать из связанных объектов',
    'Reset filter': 'Сбросить фильтр',
    'Restore selected values?': 'Востановить выбранные значения?',
    'Role': 'Роль',
    'Roles': 'Роли',
    'Roles:': 'Роли:',

    'Save': 'Сохранить',
    'Save and close': 'Сохранить и закрыть',
    'Save filter': 'Сохранить фильтр',
    'Search...': 'Искать...',
    'Select': 'Выбрать',
    'Select all': 'Выбрать все',
    'Select box': 'Выпадающий список',
    'Select column to sort': 'Выберите колонку для сортировки',
    'Select date...': 'Выберите дату...',
    'Select filter': 'Выберите фильтр',
    'Select from existing objects': 'Выбрать из существующих объектов',
    'Select items for action': 'Выберите объекты для действия',
    'Select one item for action': 'Выберите объект для действия',
    'Select values to restore': 'Выберите значения для восстановления',
    'Selection': 'Выбор',
    'Subject': 'Тема',
    'Sign in': 'Войти',
    'Sign out': 'Выйти',
    'Sort': 'Сортировать',
    'Sorting': 'Сортировка',
    'Status': 'Статус',
    'Studio': 'Студия',

    'Table:': 'Таблица:',
    'Text': 'Текст',
    'Too many files': 'Слишком много файлов',
    'Type': 'Тип',

    'Update': 'Изменить',
    'Updated at': 'Изменено',
    'Update previously saved filter?': 'Обновить ранее сохраненный фильтр?',
    'Upload completed': 'Загрузка завершена',
    'User': 'Пользователь',
    'Users': 'Пользователи',
    'Utilities': 'Утилиты',

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
    'no access': 'нет доступа',
    'not equal': 'не равно',
    'not set': 'не задано'
};