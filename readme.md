## Build

1. Clone repository
2. cd into folder
3. npm install
4. tsc
5. docker build . -t wsservice

## Run

#### Port:
Container exposes port 40510

#### Environment varialbles:
1. POLL_INTERVAL - default=3000
2. NODE_URL - default=http://1.mainnet.wavesnodes.com 

#### Client
Websocket api use /api endpoint. You can set sessionId as query string param.
#### Example:
```javascript
var ws = new WebSocket('ws://localhost:40510/api?sessionId=exampleId');
ws.onmessage = (msg) => console.log(msg.data);
ws.send('{"op":"subscribe utx"}');
```
## Commands
1. Ping
```json
{"op": "ping"}
```
2. info
```json
{"op": "ping"}
```
3. Subscribe/unsubscribe utx
```json
{"op": "subscribe utx"}
```
```json
{"op": "unsubscribe utx"}
```
4. Subscribe/unsubscribe blocks
```json
{"op": "subscribe block"}
```
```json
{"op": "unsubscribe block"}
```
5. Subscribe/unsubscribe tx
```json
{"op": "subscribe tx/{confirmed?}/{n?}"}
```
```json
{"op": "unsubscribe tx/{confirmed?}/{n?}"}
```
6. Subscribe/unsubscribe address
```json
{"op": "subscribe address/{address?}/{confirmed?}/{n?}"}
```
```json
{"op": "unsubscribe address/{address?}/{confirmed?}/{n?}"}
```