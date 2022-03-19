/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TextModelAttr = class TextModelAttr extends Jam.ModelAttr {

    activate () {
        if (this.canActivate()) {
            this.maxHeight = this.$value.outerHeight();
            this.$value.attr('rows', 1); // source rows limit max height
            this.$value.on('input', this.adjustHeight.bind(this));
            this.adjustHeight();
            this.activated = true;
        }
    }

    adjustHeight () {
        const text = this.$value.get(0);
        text.style.height = '';
        const fullHeight = text.scrollHeight + 2;
        const newHeight = fullHeight > this.maxHeight ? this.maxHeight : fullHeight;
        text.style.height = `${newHeight}px`;
    }
};