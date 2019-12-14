const HELP_MESSAGES = {
  'new': 'Create a new spamban rule `new [-time TIME] {RULE}`\nTIME - an optional argument specifying the time restriction for when accounts where created\nRULE - A regex rule for the name or nickname of accounts (for help see <https://regexr.com>)',
  'list': 'List the currently active rules',
  'help': 'Print a help message, specify a command using `help {COMMAND}`'
}

exports.getHelpMessage = function(command) {
  if (command in HELP_MESSAGES) {
    return HELP_MESSAGES[command];
  }
  return 'COULD_NOT_FIND_HELP_MESSAGE';
}
