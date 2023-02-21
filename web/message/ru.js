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

    'Access denied': 'Доступ запрещён',
    'Account': 'Аккаунт',
    'Action completed': 'Действие завершено',
    'Action failed': 'Действие не удалось',
    'Active': 'Активно',
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
    'Checkbox list': 'Список флажков',
    'Clone': 'Клонировать',
    'Close': 'Закрыть',
    'Close the last stack tab first': 'Закройте последнюю вкладку стека',
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
    'Editor': 'Редактор',
    'Email': 'Email',
    'Error': 'Ошибка',
    'Export': 'Экспортировать',

    'File': 'Файл',
    'File is not an image': 'Файл не является изображением',
    'File not found': 'Файл не найден',
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
    'Inherited value': 'Унаследованное значение',
    'Input ID...': 'Введите ID...',
    'Input number...': 'Введите число...',
    'Input value...': 'Введите значение...',
    'Invalid class file': 'Неверный файл класса',
    'Invalid metadata': 'Неверный файл класса',
    'Invalid verification code': 'Неверный проверочный код',

    'Job': 'Работа',

    'Label': 'Ярлык',
    'Language': 'Язык',
    'Last done at': 'Последний раз сделано',
    'Link': 'Добавить',
    'Load': 'Загрузить',

    'Metadata': 'Метаданные',
    'Modification date': 'Дата изменения',

    'Name': 'Название',
    'No': 'Нет',
    'No saved filters yet': 'Нет сохраненных фильтров',
    'Nothing found': 'Ничего не найдено',
    'Notification': 'Уведомление',
    'Notifications': 'Уведомления',

    'Object {id} locked by link {link}': 'Объект {id} заблокирован связью {link}',
    'Object {id}: {err}': 'Объект {id}: {err}',
    'Object select box': 'Выпадающий список объектов',
    'Office': 'Офис',
    'Only these file extensions are allowed: {extensions}': 'Допустимы только эти расширения файлов: {extensions}',
    'Only these media types are allowed: {types}': 'Допустимы только эти типы медиа: {types}',
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
    'Reset to default': 'Сбросить по умолчанию',
    'Restore selected values?': 'Востановить выбранные значения?',
    'Role': 'Роль',
    'Roles': 'Роли',
    'Roles:': 'Роли:',

    'Save': 'Сохранить',
    'Save and close': 'Сохранить и закрыть',
    'Save changes first': 'Сначала сохраните изменения',
    'Save filter': 'Сохранить фильтр',
    'Search...': 'Искать...',
    'Select': 'Выбрать',
    'Select a descendant class...': 'Выберите класс-потомок...',
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
    'Sort by': 'Сортировать по',
    'Sort related objects': 'Сортировать связанные объекты',
    'Sorting': 'Сортировка',
    'State': 'Состояние',
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
    'Upload failed': 'Загрузка не удалась',
    'User': 'Пользователь',
    'Users': 'Пользователи',
    'Utilities': 'Утилиты',

    'Value': 'Значение',
    'Value cannot be blank': 'Значение не может быть пустым',
    'Value does not match condition': 'Значение не соответствуют условию',
    'View': 'Просмотр',

    'Warning': 'Предупреждение',

    'Yes': 'Да',
    'You have no new notifications': 'Нет новых уведомлений',

    '[Attributes of descendant classes]': '[Атрибуты классов-потомков]',
    '[Nested condition]': '[Вложенное условие]',

    '[invalid data]': '[неверные данные]',

    '[no access]': '[нет доступа]',
    '[no data]': '[нет данных]',
    '[not set]': '[не задано]',

    'begins': 'начинается',

    'contains': 'содержит',

    'ends': 'заканчивается',
    'equal': 'равно',
    'equal (case-insensitive)': 'равно (без учёта регистра)',

    'greater than': 'больше чем',

    'less than': 'меньше чем',

    'nested': 'вложенный',
    'not equal': 'не равно',
    'not equal (case-insensitive)': 'не равно (без учёта регистра)',

    'regular expression': 'регулярное выражение',
};