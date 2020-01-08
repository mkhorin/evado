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


});