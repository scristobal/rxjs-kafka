jest.mock('kafkajs');

class Producer {
    #send: (topic: string, messages: unknown[]) => void;

    constructor(send: (topic: string, messages: unknown[]) => void) {
        this.#send = send;
    }

    async connect() {
        return Promise.resolve();
    }

    async send({ topic, messages }: { topic: string; messages: unknown[] }) {
        this.#send(topic, messages);
    }

    async disconnect() {
        return Promise.resolve();
    }
}

class Consumer {
    #groupId: string;
    #subscribe: (topic: string, consumer: Consumer) => void;
    eachBatch: (batch: { batch: { messages: unknown[] } }) => Promise<void> = () => Promise.resolve();

    constructor(groupId: string, subscribe: (topic: string, consumer: Consumer) => void) {
        this.#groupId = groupId;
        this.#subscribe = subscribe;
    }

    getGroupId() {
        return this.#groupId;
    }

    async connect() {
        return Promise.resolve();
    }

    async subscribe({ topic }: { topic: string }) {
        this.#subscribe(topic, this);
    }

    async run({ eachBatch }: { eachBatch: (batch: { batch: { messages: unknown[] } }) => Promise<void> }) {
        this.eachBatch = eachBatch;
    }

    async disconnect() {
        return Promise.resolve();
    }
}

class Kafka {
    #brokers: string[];
    #clientId: string;
    #topics: { [topic: string]: { [groupId: string]: Consumer[] } };

    constructor(config: { brokers: string[]; clientId: string }) {
        this.#brokers = config.brokers;
        this.#clientId = config.clientId;
        this.#topics = {};
    }

    #subscribe(topic: string, consumer: Consumer) {
        this.#topics[topic] = this.#topics[topic] || {};
        const topicConsumers = this.#topics[topic];
        topicConsumers[consumer.getGroupId()] = topicConsumers[consumer.getGroupId()] || [];
        topicConsumers[consumer.getGroupId()].push(consumer);
    }

    #send(topic: string, messages: unknown[]) {
        Object.values(this.#topics[topic]).forEach((consumers) => {
            const randomConsumer = consumers[Math.floor(Math.random() * consumers.length)];
            randomConsumer.eachBatch({
                batch: { messages }
            });
        });
    }

    producer() {
        return new Producer(this.#send.bind(this));
    }

    consumer({ groupId }: { groupId: string }) {
        return new Consumer(groupId, this.#subscribe.bind(this));
    }
}

export { Kafka };
