/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const RequestHelper = require('../../../../component/helper/RequestHelper');

describe('RequestHelper', ()=> {

    it('getArrayParam', ()=> {
        expect(RequestHelper.getArrayParam('1,2,3')).to.eql(['1', '2', '3']);
        expect(RequestHelper.getArrayParam('')).to.eql([]);
        expect(RequestHelper.getArrayParam()).to.eql(null);
    });

    it('getNotEmptyArrayParam', ()=> {
        expect(RequestHelper.getNotEmptyArrayParam('1,2,3')).to.eql(['1', '2', '3']);
        expect(RequestHelper.getNotEmptyArrayParam('')).to.eql(null);
    });

});