/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.SelectHelper = class SelectHelper {

    static fixSelect2Focus () {
        $(document).on('select2:open', () => {
            setTimeout(() => document.querySelector('.select2-search__field')?.focus(), 0);
        });
    }

    static renderOptions (data) {
        const items = [];
        if (data.hasEmpty) {
            items.push({
                text: data.emptyText || '',
                value: data.emptyValue || ''
            });
        }
        items.push(...this.normalizeItems(data.items));
        let result = '';
        for (let items of items) {
            result += this.renderOption(item, data);
        }
        return result;
    }

    static renderOption ({text, value}, {defaultValue, translate}) {
        const selected = value === defaultValue ? ' selected' : '';
        if (translate !== false) {
            text = Jam.t(text, translate);
        }
        return `<option value="${value}" ${selected}>${text}</option>`;
    }

    static normalizeItems (items) {
        if (!Array.isArray(items)) {
            const keys = items ? Object.keys(items) : [];
            items = keys.map(value => ({value, text: items[value]}));
        }
        for (let item of items) {
            item.id = item.value; // for select2
        }
        return items;
    }
};