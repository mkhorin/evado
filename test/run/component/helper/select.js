/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const SelectHelper = require('../../../../component/helper/SelectHelper');

describe('SelectHelper', ()=> {

    it('getMapItems', ()=> {
        const data = {
            1: 'one',
            2: 'two'
        };
        expect(SelectHelper.getMapItems(data)).to.eql([
            {text: 'one', value: '1'},
            {text: 'two', value: '2'}
        ]);
        expect(SelectHelper.getMapItems(null)).to.eql([]);
    });

    it('getLabelText', () => {
        expect(SelectHelper.getLabelText({
            label: 'Label',
            name: 'Name'
        })).to.eql('Label (Name)');
        expect(SelectHelper.getLabelText({
            name: 'Name'
        })).to.eql('Name');
    });

    it('getItemText', () => {
        const params = {
            textKey: 'text',
            valueKey: 'value'
        };
        expect(SelectHelper.getItemText({
            text: 'Text',
            value: 'Value'
        }, params)).to.eql('Text');
        expect(SelectHelper.getItemText({
            text: null,
            value: 'Value'
        }, params)).to.eql('Value');
    });

    it('getItems', () => {
        let items = [{
            _id: 1,
            name: 'n1'
        }, {
            _id: 2,
            name: 'n2'
        }];
        expect(SelectHelper.getItems(items)).to.eql([{
            value: 1,
            text: 'n1'
        }, {
            value: 2,
            text: 'n2'
        }]);
        items = [{
            key: 1,
            caption: 'c1'
        }, {
            key: 2,
            caption: 'c2'
        }];
        let params = {
            valueKey: 'key',
            textKey: 'caption',
            getItemText: data => `Custom ${data.caption}`
        };
        expect(SelectHelper.getItems(items, params)).to.eql([{
            value: 1,
            text: 'Custom c1'
        }, {
            value: 2,
            text: 'Custom c2'
        }]);
    });
});