/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const MetaHelper = require('../../../../component/helper/MetaHelper');

describe('MetaHelper', ()=> {

    it('isSystemName', ()=> {
        expect(MetaHelper.isSystemName('_id')).to.eql(true);
        expect(MetaHelper.isSystemName('_state')).to.eql(true);
        expect(MetaHelper.isSystemName('name')).to.eql(false);
    });

    it('createLabel', ()=> {
        const data = {
            label: 'Custom title',
            name: 'sourceTitle'
        };
        expect(MetaHelper.createLabel({data})).to.eql('Custom title');
        delete data.label;
        expect(MetaHelper.createLabel({data})).to.eql('Source title');
        expect(data.label).to.eql('Source title');
    });

    it('addClosingChar', ()=> {
        expect(MetaHelper.addClosingChar('text', '/')).to.eql('text/');
        expect(MetaHelper.addClosingChar('text/', '/')).to.eql('text/');
        expect(MetaHelper.addClosingChar(null)).to.eql(null);
        expect(MetaHelper.addClosingChar('')).to.eql('');
    });

    it('sortByOrderNumber', ()=> {
        const items = [
            {orderNumber: 2},
            {orderNumber: 4},
            {orderNumber: 1},
            {orderNumber: 3}
        ];
        expect(MetaHelper.sortByOrderNumber(items)).to.eql([
            {orderNumber: 1},
            {orderNumber: 2},
            {orderNumber: 3},
            {orderNumber: 4}
        ]);
    });

    it('sortByDataOrderNumber', ()=> {
        const items = [
            {data: {orderNumber: 2}},
            {data: {orderNumber: 1}},
            {data: {orderNumber: 4}},
            {data: {orderNumber: 3}}
        ];
        expect(MetaHelper.sortByDataOrderNumber(items)).to.eql([
            {data: {orderNumber: 1}},
            {data: {orderNumber: 2}},
            {data: {orderNumber: 3}},
            {data: {orderNumber: 4}}
        ]);
    });

    it('splitByPrefix', () => {
        expect(MetaHelper.splitByPrefix('pre/base', '/', ['pre'])).to.eql(['pre', 'base']);
        expect(MetaHelper.splitByPrefix('super/base', '/', ['pre', 'super'])).to.eql(['super', 'base']);
        expect(MetaHelper.splitByPrefix('none/base', '/', ['super'])).to.eql(undefined);
        expect(MetaHelper.splitByPrefix(null)).to.eql(undefined);
    });
});