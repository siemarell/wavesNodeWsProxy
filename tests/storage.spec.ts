import * as chai from 'chai';
import {expect, assert} from 'chai'
import {describe, before, it, after,} from 'mocha';
import {db} from '../src/storage'

describe('Storage', () => {
    it('Should return last height and sig', async () => {
        const result = await db.getlastHeightAndSig();
        expect(result.height).to.be.a('Number');
        expect(result.sig).to.be.a('String');
    });
    after(() => {
        db.destroy()
    });
});