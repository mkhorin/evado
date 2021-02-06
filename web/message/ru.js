/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 *
 * Extend default translations
 *
 * Use: Jam.t('Some text')
 * Use: <span data-t="">Some text</span>
 * Use: <div title="Some text" data-t=""></div>
 * Use: <input placeholder="Some text" type="text" data-t="">
 *
 * Define custom translation category
 *
 * Use: Jam.t('Some text', 'custom')
 * Use: <span data-t="custom">Some text</span>
 * Use: <div title="Some text" data-t="custom"></div>
 * Use: <input placeholder="Some text" type="text" data-t="custom">
 * Use: <div title="Some text" data-t-title="custom" data-t="">Text</div>
 */
'use strict';

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

    'Back to page tabs': 'Вернуться к вкладкам страниц',
    'Blocked': 'Блокирован',

    'Can not restore ambiguous values': 'Не могу восстановить неоднозначные значения',
    'Cancel': 'Отменить',
    'Change password': 'Изменить пароль',
    'Clone': 'Клонировать',
    'Close': 'Закрыть',
    'Close the last stack frame first': 'Сначала закройте последний фрейм стека',
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
    'Error': 'Ошибка',
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
    'Information': 'Информация',
    'Index definitions': 'Определения индексов',
    'Index definitions not found in class:': 'Определения индексов не найдены в классе',
    'Indexing': 'Индексирование',
    'Initial data': 'Исходные данные',
    'Input ID...': 'Введите ID...',
    'Input number...': 'Введите число...',
    'Input value...': 'Введите значение...',    
    'Invalid class file': 'Неверный файл класса',
    'Invalid metadata': 'Неверный файл класса',
    'Invalid verification code': 'Неверный проверочный код',

    'Job': 'Работа',

    'Label': 'Ярлык',
    'Last done at': 'Последний раз сделано',
    'Link': 'Добавить',
    'Load': 'Загрузить',

    'Metadata': 'Метаданные',
    'Modification date': 'Дата изменения',

    'Name': 'Название',
    'No': 'Нет',
    'No saved filters yet': 'Нет сохраненных фильтров',
    'Notification': 'Уведомление',
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
    'Select date and time...': 'Выберите дату и время...',
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
    'Value cannot be blank': 'Значение не может быть пустым',
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