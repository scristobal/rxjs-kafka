# Notes and road map

## Limitations

-   only a single topic per subject (intended)
-   only JSON payloads (intended)
-   by default only single messages can be produced (see `pushBatch$$` in the roadmap)
-   no transactions (intended, there is no equivalent mechanisms in RXJS and probably never will)

## Roadmap

-   create a `pushBatch$$` subject to allow sending an array of messages.
-   expose `batche$$` subject to allow consume a whole batch from Kafka.
-   return an observable containing the operation result when producing messages, eg. `RecordMetadata[]` returned by `producer.send()`
-   using `eachBatchAutoResolve: true` might be problematic with `take()` or similar, since the whole batch is consumed but maybe fewer elements are delivered
