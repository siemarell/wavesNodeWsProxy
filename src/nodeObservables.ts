import {Observable} from "rxjs/internal/Observable";
import {map} from "rxjs/operators";
import {interval} from "rxjs/index";

export function getObservable(channel: string): Observable<string> {
    return interval(1000).pipe(map(x => x.toString()))
}