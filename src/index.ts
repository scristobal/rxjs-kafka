import { ConsumerConfig, ConsumerSubscribeTopic, EachBatchPayload, Kafka, KafkaConfig } from 'kafkajs';
import { from, map, mergeAll, Observable, share } from 'rxjs';

type JSONObject = { [key: string]: JSON };
type JSONArray = Array<JSON>;
type JSON = null | string | number | boolean | JSONArray | JSONObject;

const fromKafkaTopic = function (
    options: KafkaConfig,
    topic: ConsumerSubscribeTopic,
    consumerOptions?: ConsumerConfig
) {
    const kafka = new Kafka(options);

    const consumer = kafka.consumer(consumerOptions);

    const setup = async () => {
        await consumer.connect();

        await consumer.subscribe(topic);
    };

    const processBatchWith = async (batchProcessor: (_: EachBatchPayload) => Promise<void>) => {
        await consumer.run({
            eachBatchAutoResolve: true,
            eachBatch: batchProcessor
        });
    };

    async function disconnect() {
        await consumer.disconnect();
    }

    function connect() {
        const batche$ = new Observable<EachBatchPayload>((subscriber) => {
            const asyncNext = async (bachBlock: EachBatchPayload) => {
                subscriber.next(bachBlock);
            };

            setup().then(() => processBatchWith(asyncNext));

            return () => {
                disconnect();
            };
        });

        const message$ = batche$.pipe(
            map((bachBlock) => from(bachBlock.batch.messages)),
            mergeAll(),
            map((msg) => {
                const msgContent = msg.value?.toString();
                if (!msgContent) return;
                try {
                    return JSON.parse(msgContent) as JSON;
                } catch {
                    throw new Error('Could not parse message');
                }
            })
        );

        return message$.pipe(share());
    }

    return connect();
};

export { fromKafkaTopic };
