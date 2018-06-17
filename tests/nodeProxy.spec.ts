import {sync} from '../src/nodeProxy';
import * as chai from 'chai';
import {expect} from 'chai'
import {describe, before, it} from 'mocha';

chai.use(require('chai-http'));
describe('get utx', () => {
    it('should return utx array', () => {
        const a = chai.request(baseNodeUrl)
            .get('/transactions/unconfirmed')
            .send()
            .then((resp) =>{
                expect(resp.body).to.be.an('Array')
            })
    })
});