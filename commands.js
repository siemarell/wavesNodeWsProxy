const commands = ['addr_sub', 'addr_unsub'];
const checkCommand = cmd => {
    return commands.indexOf(cmd.cmd) != -1
};
module.exports = {
    commands,
    parseCommand: checkCommand
};