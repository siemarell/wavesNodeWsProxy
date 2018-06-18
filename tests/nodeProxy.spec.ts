import {NodeProxy, INodeProxy} from '../src/nodeProxy';
import * as chai from 'chai';
import {expect, assert} from 'chai'
import {describe, before, it, } from 'mocha';
import {NodeApi} from "../src/nodeApi";
import {config} from "../src/config";
//chai.use(require('chai-http'));

describe('Node Proxy', () => {
    const nodeProxy = new NodeProxy(new NodeApi(config.nodeUrl), config.pollInterval);
    it('Should return utx channel observable', () => {
        const utxChannel = nodeProxy.getChannel('utx');
        expect(utxChannel.source.subscribe).to.be.an('Function');
    })
    nodeProxy.destroy()
});