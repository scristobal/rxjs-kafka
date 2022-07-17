# rxjs-kafka or rxkfk

A no fuss rxjs wrapper for kafkajs, focused on ease of use.

## Who?

Anyone who just wants to read/write Kafka topics from the comfort of reactive javascript.

## Getting started

> This section follows the same example as in KakfaJS docs (<https://kafka.js.org/docs/getting-started>)

### Setup

Install rxkfk using yarn:

```bash
yarn add rxjs-kafka kafkajs rxjs
```

Or npm:

```bash
npm install rxjs-kafka kafkajs rxjs
```

### Example

```typescript
import { withRx } from 'rxjs-kafka';
import { Kafka } from 'kafkajs';
import { of, first } from 'rxjs';

/// ---- setup -----

const kafka = new Kafka({clientId: 'my-app',brokers: ['kafka1:9092', 'kafka2:9092']})

const rxkafka = withRx(kafka); // !important

/// ---- send -----

const producer = rxkafka.producer();

const send = producer.observer({ topic: 'test-topic' }));

of('Hello KafkaJS user!').subscribe(send);

// ---- receive -----

const consumer = rxkafka.consumer({ groupId: 'test-group' });

const message$ = consumer.observable({ topic: 'test-topic', fromBeginning: true });

message$.pipe(first()).subscribe(console.log);
```

## Notes

-   in the future we might expose `batches` to allow consume/send a whole batch from Kafka.
-   there is no way to access the operations results when producing messages with the observer, eg. `RecordMetadata[]` returned by `producer.send()`
-   using `eachBatchAutoResolve: true` might be problematic with `take()` or similar, since the whole batch is consumed but maybe fewer elements are delivered
