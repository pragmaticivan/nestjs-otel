# Prometheus + Grafana + Tempo + Loki Observability Stack example

### Running

`docker-compose up --build`
### Viewing Traces
1. Makes some data by visiting `http://localhost:5555`
2. View logs by visiting Grafana
   1. Select the Explore>Loki> and query the Log browser. Query for `{filename="/app/logs/nestjs-example.log"}`
   2. Select a log. Note the TraceId in the log. Upon opening the log press the `Tempo` button to view a trace.

