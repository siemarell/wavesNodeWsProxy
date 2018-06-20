## Build

1. Clone repository
2. cd into folder
3. npm install
4. tsc
5. docker build . -t wsservice

## Run

####Port:
Container exposes port 40510

#### Environment varialbles:
1. POLL_INTERVAL - default=3000
2. NODE_URL - default =http://1.mainnet.wavesnodes.com 