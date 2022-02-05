/**
 * @copyright Copyright (c) 2022 Maxim Khorin <maksimovichu@gmail.com>
 */
Jam.TextModelAttr = class TextModelAttr extends Jam.ModelAttr {

    activate () {
        if (this.canActivate()) {
            this.maxHeight = this.$value.outerHeight();
            this.$value.removeAttr('rows'); // rows limit max height
            this.$value.on('input', this.adjustHeight.bind(this));
            this.adjustHeight();
            this.activated = true;
        }
    }

    adjustHeight () {
        const text = this.$value.get(0);
        const styles = window.getComputedStyle(text);
        const paddingTop = parseFloat(styles.getPropertyValue('padding-top'));
        const paddingBottom = parseFloat(styles.getPropertyValue('padding-bottom'));
        text.style.height = '';
        const fullHeight = text.scrollHeight + paddingTop + paddingBottom;
        const newHeight = fullHeight > this.maxHeight ? this.maxHeight : fullHeight;
        text.style.height = `${newHeight}px`;
    }
};