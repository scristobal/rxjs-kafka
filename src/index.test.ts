import rxfkf from './index';
import { take, interval, lastValueFrom, asyncScheduler, observeOn, Subject } from 'rxjs';

jest.mock('kafkajs');
jest.setTimeout(30_000);

describe('Consumers', () => {
    it('should get messages sent by the producer', async () => {
        expect.assertions(1);

        const mockObserver = jest.fn();

        const topic = { topic: 'topic-test', fromBeginning: false };

        const groupId = 'example-group';

        const cfg = {
            brokers: ['kafka:9092'],
            clientId: 'example-producer'
        };

        const { message$, send } = rxfkf<number>(cfg, topic, { groupId });

        message$.pipe(take(3)).subscribe({
            next: (x) => {
                mockObserver(x);
            }
        });

        const pushMessage$$ = new Subject<number>();

        pushMessage$$.pipe(observeOn(asyncScheduler)).subscribe(send);

        interval(1000).pipe(take(6)).subscribe(pushMessage$$);

        await lastValueFrom(pushMessage$$).catch(() => {
            throw new Error('There was a problem finalizing the consumer');
        });

        expect(mockObserver.mock.calls.length).toBe(3);
    });
});

afterEach(async () => {
    const flushPromises = () => new Promise(setImmediate);

    await flushPromises();
});
