/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ValueMapModelAttr = class ValueMapModelAttr extends Jam.ModelAttr {

    init () {
        this.$list = this.find('.value-map-items');
        this.$list.on('click', '[data-id="add"]', this.onAddItem.bind(this));
        this.$list.on('click', '[data-id="down"]', this.onDownItem.bind(this));
        this.$list.on('click', '[data-id="up"]', this.onUpItem.bind(this));
        this.$list.on('click', '[data-id="delete"]', this.onDeleteItem.bind(this));
        this.$list.on('keyup', '.param', this.onUpdate.bind(this));
        this.createItems(Jam.Helper.parseJson(this.$value.val()) || []);
    }

    stringify () {
        let items = [];
        for (let item of this.getItems()) {
            item = this.getItemData($(item));
            item.text = item.text === '' ? item.value : item.text;
            items.push(item);
        }
        items = items.filter(item => item.text !== '');
        return items.length ? JSON.stringify(items) : '';
    }

    createItems (items) {
        if (Array.isArray(items)) {
            const $items = this.getItems();
            const $item = $items.eq(0);
            for (let i = 1; i < items.length; ++i) {
                $item.after($item.clone());
            }
            this.getItems().each((index, element) => {
                this.setItemData($(element), items[index]);
            });
        }
    }

    getItem (child) {
        return $(child).closest('.value-map-item');
    }

    getItems () {
        return this.$list.children();
    }

    getItemData ($item) {
        const value = $.trim($item.find('.value-param').val());
        const text = $.trim($item.find('.text-param').val());
        return {value, text};
    }

    setItemData ($item, data) {
        const value = data ? $.trim(data.value) : '';
        $item.find('.value-param').val(value);
        const text = data ? $.trim(data.text) : '';
        $item.find('.text-param').val(text);
    }

    onAddItem (event) {
        const $item = this.getItem(event.target);
        const $new = $item.clone();
        $new.find('input').val('');
        $item.after($new);
    }

    onUpItem (event) {
        const $item = this.getItem(event.target);
        const $prev = $item.prev();
        if ($prev.length) {
            $prev.before($item);
            this.onUpdate();
        }
    }

    onDownItem ({target}) {
        const $item = this.getItem(target);
        const $next = $item.next();
        if ($next.length) {
            $next.after($item);
            this.onUpdate();
        }
    }

    onDeleteItem ({target}) {
        const $items = this.getItems();
        if ($items.length > 1) {
            this.getItem(target).remove();
        } else {
            this.setItemData($items.eq(0));
        }
        this.onUpdate();
    }

    onUpdate () {
        this.$value.val(this.stringify()).change();
    }
};