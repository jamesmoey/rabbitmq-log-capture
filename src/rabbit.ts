/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../node_modules/rx/ts/rx.all.d.ts" />

import * as Rx from 'rx';
import * as rabbit from 'rabbit.js';

export module Messaging {

    export enum PubSocketType {
        PUBLISH = <any>'PUB',
        PUSH = <any>'PUSH',
        REQUEST = <any>'REQUEST',
    }

    export enum SubSocketType {
        SUBSCRIBE = <any>'SUB',
        PULL = <any>'PULL',
        REPLY = <any>'REPLY',
        WORKER = <any>'WORKER',
    }

    export enum RoutingType {
        FANOUT = <any>'fanout',
        DIRECT = <any>'direct',
        TOPIC = <any>'topic',
    }

    interface IOpts {
        uri: string,
        queue: string,
        routing?: RoutingType,
        topic: string[],
    }

    interface IPubOpts extends IOpts {
        socketType: PubSocketType,
    }

    interface ISubOpts extends IOpts {
        socketType: SubSocketType,
    }

    export function subscribe(opts: ISubOpts): Rx.Observable<Buffer> {
        return Rx.Observable.create<Buffer>((observer: Rx.IObserver<any>) => {
            var context: rabbit.Context = rabbit.createContext(opts.uri);
            context.on('ready', () => {
                console.log('connecting to ', opts.uri);
                var socket = context.socket<rabbit.SubSocket>(<any>opts.socketType, { routing: opts.routing });
                socket.on('data', chunk => observer.onNext(chunk));
                socket.on('error', err => observer.onError(err));
                socket.on('end', () => observer.onCompleted());
                opts.topic.forEach(topic => socket.connect(opts.queue, topic));
            });
            return () => {
                return context.close(() => {});
            }
        });
    }
    
    export function publish(opts: IPubOpts): Rx.IObservable<rabbit.PubSocket>  {
        return Rx.Observable.create<rabbit.PubSocket>((observer: Rx.IObserver<any>) => {
            var context: rabbit.Context = rabbit.createContext(opts.uri);
            context.on('error', err => {
                observer.onError(err);
                observer.onCompleted();
            });
            context.on('ready', () => {
                var socket = context.socket<rabbit.SubSocket>(<any>opts.socketType, { routing: opts.routing });
                socket.on('error', err => observer.onError(err));
                socket.on('close', err => observer.onCompleted());
                socket.connect(opts.queue, () => observer.onNext(socket));
            });
            return () => {
                return context.close(() => {});
            }
        });
    }
}