
export const config = {
    appPort: 40510,
    nodeUrl: process.env.NODE_URL || "http://1.mainnet.wavesnodes.com",
    pollInterval: parseInt(process.env.POLL_INTERVAL) || 3000,
    utxAbsent: 20
};