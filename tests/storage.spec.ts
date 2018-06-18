import * as chai from 'chai';
import {expect, assert} from 'chai'
import {describe, before, it, after,} from 'mocha';
import {db} from '../src/storage'
import {async} from "rxjs/internal/scheduler/async";

describe('Storage', () => {
    it('Should return last height and sig', async () => {
        const result = await db.getlastHeightAndSig();
        expect(result.height).to.be.a('Number');
        expect(result.sig).to.be.a('String');
    });

    it('Should save and return subscriptions', async ()=>{
        await db.saveSubscription('123', 'first');
        await db.saveSubscription('123', 'second');
        const result = await db.getAllSubscriptions('123');
        assert(result.length === 2);
        assert(result.indexOf('first') >-1);
        assert(result.indexOf('second') >-1);
    });

    it('Should delete subscriptions', async ()=>{
        await db.saveSubscription('123', 'first');
        await db.saveSubscription('123', 'second');
        await db.deleteSubscription('123', 'first');
        await db.deleteSubscription('123', 'second');
        const result = await db.getAllSubscriptions('123');
        assert(result.length === 0);
    });

    after(() => {
        db.destroy()
    });
});