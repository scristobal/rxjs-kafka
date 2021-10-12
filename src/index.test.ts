import fromKafkaTopic from './index';
import ip from 'ip';
import { take, interval, lastValueFrom } from 'rxjs';
import { Kafka, logLevel } from 'kafkajs';

jest.setTimeout(30_000);

describe('Consumers', () => {
    it('should get messages sent by the producer', async () => {
        expect.assertions(1);

        const mockObserver = jest.fn();

        const host = process.env.HOST_IP || ip.address();

        const topic = { topic: 'topic-test', fromBeginning: false };

        const groupId = 'example-group';

        const cfg = {
            logLevel: logLevel.ERROR,
            brokers: [`${host}:9092`],
            clientId: 'example-producer'
        };

        const kafka = new Kafka(cfg);

        const admin = kafka.admin();

        await admin.connect();

        const currentOffsets = await admin.fetchTopicOffsetsByTimestamp(topic.topic, Date.now());

        await admin.setOffsets({
            groupId,
            topic: topic.topic,
            partitions: currentOffsets
        });

        await admin.disconnect();

        const { message$$, pushMessage$$ } = fromKafkaTopic(cfg, topic, { groupId });

        message$$.pipe(take(3)).subscribe({
            next: (x) => {
                mockObserver(x);
            }
        });

        interval(1000).pipe(take(6)).subscribe(pushMessage$$);

        await lastValueFrom(pushMessage$$);

        expect(mockObserver.mock.calls.length).toBe(3);
    });
});
