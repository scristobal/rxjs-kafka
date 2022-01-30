import {
    ConsumerConfig,
    ConsumerSubscribeTopic,
    EachBatchPayload,
    Kafka,
    KafkaConfig,
    ProducerConfig,
    ProducerRecord
} from 'kafkajs';
import { asyncScheduler, from, map, mergeAll, Observable, observeOn, share, Subject } from 'rxjs';

type JSONObject = { [key: string]: JSON };
type JSONArray = Array<JSON>;
type JSON = null | string | number | boolean | JSONArray | JSONObject;

const rxkfk = function <T>(
    kafkaOptions: KafkaConfig,
    topicOptions: ConsumerSubscribeTopic | string,
    consumerOptions?: ConsumerConfig,
    producerOptions?: ProducerConfig
) {
    const kafka = new Kafka(kafkaOptions);

    function isConsumerSubscribeTopic(
        topicOptions: ConsumerSubscribeTopic | string
    ): topicOptions is ConsumerSubscribeTopic {
        return Object.hasOwnProperty.call(topicOptions, 'topic');
    }

    function assertTopicString(topic: string | RegExp): asserts topic is string {
        if (!(typeof topic === 'string' || topic instanceof String))
            throw new Error("Can't send messages to a topic defined by a regex");
    }

    const topic = isConsumerSubscribeTopic(topicOptions) ? topicOptions : { topic: topicOptions };

    const batche$ = new Observable<EachBatchPayload>((subscriber) => {
        const consumer = kafka.consumer(consumerOptions);

        const processBatchWith = async () => {
            await consumer.connect();

            await consumer.subscribe(topic);

            await consumer.run({
                eachBatchAutoResolve: true,
                eachBatch: async (bachBlock: EachBatchPayload) => {
                    subscriber.next(bachBlock);
                }
            });
        };

        processBatchWith().catch(() => {
            throw new Error('There was a problem setting up the consumer');
        });

        return async () => {
            try {
                await consumer.disconnect();
            } catch {
                throw new Error('Consumer could not be disconnected');
            }
        };
    });

    const message$ = batche$.pipe(
        map((bachBlock) => from(bachBlock.batch.messages)),
        mergeAll(),
        map((msg) => {
            const msgContent = msg.value?.toString();
            if (!msgContent) return;
            try {
                return JSON.parse(msgContent) as T;
            } catch {
                throw new Error('Could not parse message');
            }
        })
    );

    const message$$ = message$.pipe(share());

    const pushMessage$$ = new Subject<T | undefined>();

    const pushMessage = function () {
        const producer = kafka.producer(producerOptions);
        let connected = false;

        const topicExp = topic.topic;

        assertTopicString(topicExp);

        return {
            next: async (message: T | undefined) => {
                const record: ProducerRecord = {
                    topic: topicExp,
                    messages: [{ value: JSON.stringify(message) }]
                };

                const asyncPush = async (record: ProducerRecord) => {
                    if (!connected) {
                        await producer.connect();
                        connected = true;
                    }

                    await producer.send(record);
                };

                try {
                    await asyncPush(record);
                } catch {
                    throw new Error('There was a problem pushing to the topic');
                }
            },
            error: (error: unknown) => console.error(error),

            complete: async () => {
                try {
                    await producer.disconnect();
                    connected = false;
                } catch {
                    throw new Error('Producer could not get disconnected');
                }
            }
        };
    }.call(undefined);

    pushMessage$$.pipe(observeOn(asyncScheduler)).subscribe(pushMessage);

    return { message$$, pushMessage$$ };
};

export default rxkfk;
