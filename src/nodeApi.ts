import * as request from 'request-promise';

export interface INodeApi {
    checkAddress(address: string): Promise<boolean>;
    getHeightAndSig(): Promise<{currentHeight:number,currentSig:string}>;
    getUtxs(): Promise<Array<any>>;
    getBlocks(from: number, to: number): Promise<Array<any>>;
    getBlockAt(height: number): Promise<any>;
    getBlockBy(signature: string): Promise<any>;
    getAddressTxs(address: string, limit?: number): Promise<Array<any>>;
}

export class NodeApi implements INodeApi {
    constructor(private nodeUrl: string){}

    async checkAddress(address: string): Promise<boolean> {
        const options = {
            uri: `${this.nodeUrl}/addresses/validate/${address}`,
            json: true
        };
        const resp = await request.get(options);
        return resp.valid;
    }

    async getHeightAndSig(): Promise<{currentHeight:number,currentSig:string}> {
        const options = {
            uri: `${this.nodeUrl}/blocks/headers/last`,
            json: true
        };
        const resp = await request.get(options);
        return {currentHeight:resp.height, currentSig:resp.signature};
    }

    async getAddressTxs(address: string, limit: number=100): Promise<Array<any>> {
        const options = {
            uri: `${this.nodeUrl}/transactions/address/${address}/limit/${limit}`,
            json: true
        };
        return await request.get(options);
    }

    async getBlocks(from: number, to: number): Promise<Array<any>> {
        const options = {
            uri: `${this.nodeUrl}/blocks/seq/${from}/${to}`,
            json: true
        };
        return await request.get(options);
    }

    async getBlockAt(height:number){
        const options = {
            uri: `${this.nodeUrl}/blocks/at/${height}`,
            json: true
        };
        return await request.get(options);
    }

    async getBlockBy(signature: string){
        const options = {
            uri: `${this.nodeUrl}/blocks/signature/${signature}`,
            json: true
        };
        return await request.get(options);
    }

    async getUtxs(): Promise<Array<any>> {
        const options = {
            uri: `${this.nodeUrl}/transactions/unconfirmed`,
            json: true
        };
        return await request.get(options);
    }

}