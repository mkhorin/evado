/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.ListFilterStorage = class ListFilterStorage {

    constructor (filter) {
        this.filter = filter;
        this.key = filter.params.url;

        this.$saveModal = filter.$container.find('.save-modal');
        this.$save = this.$saveModal.find('[data-id="save"]');
        this.$save.click(this.onSave.bind(this));
        this.$name = this.$saveModal.find('[name="name"]');

        this.$inputToggle = filter.$commands.find('[data-id="save"]');
        this.$inputToggle.click(this.onToggleSave.bind(this));

        this.$selectModal = filter.$container.find('.select-modal');
        this.$apply = this.$selectModal.find('[data-id="apply"]');
        this.$apply.click(this.onApply.bind(this));
        this.$update = this.$selectModal.find('[data-id="update"]');
        this.$update.click(this.onUpdateName.bind(this));
        this.$delete = this.$selectModal.find('[data-id="delete"]');
        this.$delete.click(this.onDelete.bind(this));

        this.$list = this.$selectModal.find('.list-group');
        this.$list.on('click', '.list-group-item', this.onItem.bind(this));
        this.$list.on('dblclick', '.list-group-item', this.onApply.bind(this));

        this.$selectToggle = filter.$commands.find('[data-id="select"]');
        this.$selectToggle.click(this.onToggleSelect.bind(this));

        this.load();
    }

    getItem (name) {
        return Jam.ArrayHelper.getByNestedValue(name, 'name', this.items);
    }

    getSelectedItem () {
        return this.items[this.getSelectedElement().index()];
    }

    getSelectedElement () {
        return this.$list.find('.selected');
    }

    load () {
        const items = Jam.localStorage.get(this.key);
        this.items = Array.isArray(items) ? items : [];
    }

    store () {
        Jam.localStorage.set(this.key, this.items);
    }

    toggleSave (state) {
        if (state) {
            this.saveModal = Jam.showModal(this.$saveModal);
        } else {
            this.saveModal?.hide();
        }
    }

    toggleSelect (state) {
        if (state) {
            this.selectModal = Jam.showModal(this.$selectModal);
        } else {
            this.selectModal?.hide();
        }
    }

    onToggleSelect () {
        this.createItems();
        this.toggleSelect(true);
    }

    onToggleSave () {
        const data = this.filter.serialize();
        if (!data) {
            return Jam.dialog.alert('Add condition to save');
        }
        this.updatedItem = null;
        this.clearErrors();
        this.toggleSave(true);
    }

    onSave () {
        this.clearErrors();
        const name = $.trim(this.$name.val());
        if (!name.length) {
            return this.addError(this.$name, 'Value cannot be blank');
        }
        if (this.updatedItem) {
            return this.update(name);
        }
        const found = this.getItem(name);
        if (!found) {
            return this.insert(name);
        }
        Jam.dialog.confirm('Update previously saved filter?')
            .then(this.replace.bind(this, found));
    }

    update (name) {
        const found = this.getItem(name);
        if (found && found !== this.updatedItem) {
            return this.addError(this.$name, 'Name has already been taken');
        }
        this.updatedItem.name = name;
        this.store();
        this.toggleSave(false);
        this.onToggleSelect();
    }

    insert (name) {
        this.items.unshift({name});
        this.replace(this.items[0]);
    }

    replace (item) {
        item.data = this.filter.serialize();
        this.clearSelect();
        this.store();
        this.toggleSave(false);
    }

    clearErrors () {
        this.$saveModal.find('.has-error').removeClass('has-error');
    }

    addError ($input, message) {
        $input.closest('.form-group').addClass('has-error').find('.error-block').html(Jam.t(message));
    }

    onApply () {
        const item = this.getSelectedItem();
        if (item) {
            this.filter.parse(item.data);
            this.$name.val(item.name);
            this.toggleSelect(false);
        }
    }

    onUpdateName () {
        this.updatedItem = this.getSelectedItem();
        if (this.updatedItem) {
            this.toggleSelect(false);
            this.$name.val(this.updatedItem.name);
            this.clearErrors();
            this.toggleSave(true);
        }
    }

    onDelete () {
        if (this.getSelectedItem()) {
            Jam.dialog.confirmDeletion().then(this.deleteItem.bind(this));
        }
    }

    onItem (event) {
        this.clearSelect();
        $(event.currentTarget).addClass('selected');
    }

    clearSelect () {
        this.$list.find('.selected').removeClass('selected');
    }

    createItems () {
        const index = this.getSelectedElement().index();
        this.$list.html(this.items.map(this.createItem, this).join(''));
        const $items = this.$list.children();
        if (index !== -1) {
            $items.eq(index).click();
        }
        this.$selectModal.toggleClass('empty', !$items.length);
    }

    createItem (data) {
        const template = Jam.Helper.getTemplate('item', this.filter.$container);
        return Jam.Helper.resolveTemplate(template, {
           name: data.name,
           params: JSON.stringify(data)
        });
    }

    deleteItem () {
        const $item = this.getSelectedElement();
        this.items.splice($item.index(), 1);
        $item.remove();
        this.store();
    }
};