/// <reference path="../typings/tsd.d.ts" />

import * as util from 'util';
import { Command } from "commander";
import { Messaging } from './rabbit';

interface LogMessage {
    topic: string,
    value: any,
    time: Date,
    tag: string[]
}

var program: any = (new Command('logCapture'))
    .version('0.0.1')
    .option('-s, --server [value]', 'RabbitMQ Host.')
    .option('-u, --user [value]', 'RabbitMQ Username.')
    .option('-p, --password [value]', 'RabbitMQ Password.')
    .option('-q, --queue [value]', 'Queue to connect to.')
    .option('-t, --topic [value]', 'List of topics to subscribe to, separate by comma.', val => val.split(','), ['#'])
    .parse(process.argv);

Messaging.subscribe({
    uri: `amqp://${program.user}:${program.password}@${program.server}`,
    socketType: Messaging.SubSocketType.SUBSCRIBE,
    queue: program.queue,
    routing: Messaging.RoutingType.TOPIC,
    topic: program.topic
})
    .map((buffer: Buffer) => JSON.parse(buffer.toString()))
    .map((result: LogMessage) => util.format('[%d] %s (%s) - %j', result.time, result.topic, result.tag.join(','), result.value))
    .subscribe((msg: string) => console.log(msg));