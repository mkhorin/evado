/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Jam.ModelAttr.ValueMap = class extends Jam.ModelAttr {

    init () {
        this.$list = this.$attr.find('.value-map-items');
        this.$list.on('click', '.control-add', this.addItem.bind(this));
        this.$list.on('click', '.control-down', this.downItem.bind(this));
        this.$list.on('click', '.control-up', this.upItem.bind(this));
        this.$list.on('click', '.control-remove', this.removeItem.bind(this));
        this.$list.on('keyup', '.param', this.update.bind(this));
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
            let $items = this.getItems();
            let $item = $items.eq(0);
            for (let i = 1; i < items.length; ++i) {
                $item.after($item.clone());
            }
            this.getItems().each((index, element)=> {
                this.setItemData($(element), items[index]);
            });
        }
    }

    // ITEM

    getItem (child) {
        return $(child).closest('.value-map-item');
    }

    getItems () {
        return this.$list.children();
    }

    getItemData ($item) {
        return {
            value: $.trim($item.find('.value-param').val()),
            text: $.trim($item.find('.text-param').val())
        };
    }

    setItemData ($item, data) {
        $item.find('.value-param').val(data ? $.trim(data.value) : '');
        $item.find('.text-param').val(data ? $.trim(data.text) : '');
    }

    // EVENTS

    addItem (event) {
        let $item = this.getItem(event.target);
        let $new = $item.clone();
        $new.find('input').val('');
        $item.after($new);
    }

    upItem (event) {
        let $item = this.getItem(event.target);
        let $prev = $item.prev();
        if ($prev.length) {
            $prev.before($item);
            this.update();
        }
    }

    downItem (event) {
        let $item = this.getItem(event.target);
        let $next = $item.next();
        if ($next.length) {
            $next.after($item);
            this.update();
        }
    }

    removeItem (event) {
        let $items = this.getItems();
        if ($items.length > 1) {
            this.getItem(event.target).remove();
        } else {
            this.setItemData($items.eq(0));
        }
        this.update();
    }

    update () {
        this.$value.val(this.stringify()).change();
    }
};