import {createLogger, transports, format} from "winston";

const {combine, timestamp, label, prettyPrint, printf, colorize, json} = format;

const consoleFormat = printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`
});
export const logger = createLogger({
    level: 'info',
    transports: [
        new transports.File({
            filename: 'app.log',
            format: combine(timestamp(), json())
        }),
        new transports.Console({
            format: combine(
                timestamp(),
                colorize(),
                consoleFormat
            )
        })
    ]
});