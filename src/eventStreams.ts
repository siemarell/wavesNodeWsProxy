import * as Observable from "rxjs";

export const TrasactionsSteam = (wallet: string) => {
    return Observable.of('1')
};

export const BalanceStream = (wallet: string) => {
    return Observable.of('2')
};

