import {interval} from "rxjs"
import {Observable} from "rxjs/internal/Observable";
import { map } from 'rxjs/operators';

export function getSubscription(msg: any): Observable<string> {
    return interval(1000).pipe(map(x=> x.toString()))
};
