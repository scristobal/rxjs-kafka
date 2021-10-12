# rxkfk

A no fuss rxjs wrapper for kafkajs, focused on ease of use.

## Getting started

> This section follows the same example as in KakfaJS docs (https://kafka.js.org/docs/getting-started)

Install rxkfk using yarn:

```bash
yarn add rxkfk
```

Or npm:

```bash
npm install rxkfk
```

Let's start by creating our RxJS subjects, using our Kafka brokers, topic and consumer details:

```typescript
import fromKafkaTopic from 'rxkfk';
import { of, first } from 'rxjs';

const { message$$, pushMessage$$ } = fromKafkaTopic(
    {
        clientId: 'my-app',
        brokers: ['kafka1:9092', 'kafka2:9092']
    },
    { topic: 'test-topic', fromBeginning: true },
    { groupId: 'test-group' }
);
```

Now to produce a message to a topic, we'll subscribe `pushMessage$$` to an observable:

```typescript
of('Hello KafkaJS user!').subscribe(pushMessage$$);
```

Finally, to verify that our message has indeed been produced to the topic, let's subscribe an observer to the `message$$` subject:

```typescript
message$$.pipe(first()).subscribe(console.log);
```

Congratulations, you just produced and consumed your first Kafka message using RxJS and a bit of help from rxkfk!
