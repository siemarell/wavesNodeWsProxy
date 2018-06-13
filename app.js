const ws = require('ws')

const express = require('express')
const app = express()

const wss = new ws.Server({port: 40510})

const commands = require('./commands.js')

wss.on('connection', ws =>{
    let subscriptions = [];
    ws.on('message', msg => {
        const eventObservable = commands.parseCommand(msg)
        if(!eventObservable){
            ws.send(`Bad command: ${msg}`)
        }else{
            ws.send(`Ok: ${msg}`)
            eventObservable.forEach(event => ws.send(event))
        }
    });

    ws.on('close', ()=> subscriptions.forEach(sub=> sub.unsubscribe()))
});



app.listen(3000, () => console.log('Example app listening on port 3000!'))