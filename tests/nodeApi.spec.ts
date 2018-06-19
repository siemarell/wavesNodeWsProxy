import {NodeApi, INodeApi} from '../src/nodeApi';
import {expect, assert} from 'chai'
import {describe, before, it} from 'mocha';
import {config} from '../src/config'

describe('Node API', () => {
    const nodeApi: INodeApi = new NodeApi(config.nodeUrl);

    it('Should check valid address', async () => {
        const result = await nodeApi.checkAddress('3PQTLvUBBd7naCzQLux7ZMwBj8ATCuP9DLN');
        assert(result)
    });

    it('Should reject invalid address', async () => {
        const result = await nodeApi.checkAddress('3PQTLvUBB1d7naCzQLux7ZMwBj8ATCuP9DLN');
        assert(!result)
    });

    it('Should get blockchain height and last block sig', async () => {
        const result = await nodeApi.getHeightAndSig();
        expect(result.currentHeight).to.be.a('Number');
        expect(result.currentSig).to.be.a('String');
    });

    it('Should get utxs from node', async () => {
        const result = await nodeApi.getUtxs();
        expect(result).to.be.an('Array');
    });


    it('Should get transactions with specified address involved', async () => {
        const result = await nodeApi.getAddressTxs('3PQTLvUBBd7naCzQLux7ZMwBj8ATCuP9DLN');
        expect(result).to.be.an('Array');
    });

    it('Should get blocks from blockchain', async () => {
        const result = await nodeApi.getBlocks(1046560, 1046564);
        expect(result).to.be.an('Array');
        assert(result.length === 5);
    });

    it('Should get block at specific height', async () => {
        const result = await nodeApi.getBlockAt(190);
        assert(result.signature === '2gqi8WwkSbCUQSL7SPWr8jxhMXWKApQVP57ykxELr5ghetHp2MABCPyy3EdGNF15QKthdFzFsjj2EcGikf1QK3P6');
    });

    it('Should get block header at specific height', async () => {
        const result = await nodeApi.getBlockHeaderAt(190);
        assert(result.signature === '2gqi8WwkSbCUQSL7SPWr8jxhMXWKApQVP57ykxELr5ghetHp2MABCPyy3EdGNF15QKthdFzFsjj2EcGikf1QK3P6');
    });

    it('Should get block by signature', async () => {
        const result = await nodeApi.getBlockBy('2gqi8WwkSbCUQSL7SPWr8jxhMXWKApQVP57ykxELr5ghetHp2MABCPyy3EdGNF15QKthdFzFsjj2EcGikf1QK3P6');
        assert(result.height === 190);
    });

});