export const asleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const filterByAddress = (address: string) => (tx:any) => [tx.sender, tx.recipient].indexOf(address) > -1;