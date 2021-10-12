import fromKafkaTopic from '../src/index.js';
import ip from 'ip';

import { take, interval } from 'rxjs';
import { Kafka, logLevel } from 'kafkajs';

const host = process.env.HOST_IP || ip.address();

const topic = { topic: 'topic-test', fromBeginning: false };

const cfg = {
    brokers: [`${host}:9092`],
    clientId: 'example-producer',
    logLevel: logLevel.INFO
};

async function setOffsetToLatest(groupId: string): Promise<void> {
    const kafka = new Kafka(cfg);

    async function moveToLastOffset(topic: string) {
        console.log(`i- Setting topic offset to latest...`);

        const currentOffsets = await admin.fetchTopicOffsetsByTimestamp(topic, Date.now());

        try {
            await admin.setOffsets({
                groupId,
                topic,
                partitions: currentOffsets
            });

            console.log(`i- The topic has been fast-forwarded to latest!`);
        } catch (error) {
            console.log(`XX There was an error fast-forwarding the topic` + error);
        }
    }

    const admin = kafka.admin();

    await admin.connect();

    await moveToLastOffset(topic.topic);

    await admin.disconnect();
}

setOffsetToLatest('example-producer').then(() => {
    const { message$$, pushMessage$$ } = fromKafkaTopic(cfg, topic, { groupId: 'example-producer' });

    message$$.pipe(take(5)).subscribe({
        next: (x) => {
            console.log('<- first consumer got a new msg: ' + JSON.stringify(x));
        },
        complete: () => {
            console.log('-x first consumer is done');
        },
        error: (error) => console.error('ERROR from first producer ' + error)
    });

    message$$.pipe(take(4)).subscribe({
        next: (x) => {
            console.log('<- second consumer got a new msg: ' + JSON.stringify(x));
        },
        complete: () => {
            console.log('-x second consumer is done');
        },

        error: (error) => console.error('ERROR from second consumer ' + error)
    });

    interval(1000).pipe(take(5)).subscribe(pushMessage$$);

    pushMessage$$.subscribe({
        next: (x) => {
            console.log('-> a msg was sent: ' + JSON.stringify(x));
        },
        complete: () => {
            console.log('x- producer is done');
        },
        error: (error) => console.error('ERROR from producer ' + error)
    });
});
