# Discord anti-spambot

## Requirements
Node > 10.15.0 and its relevant version of NPM

Before using make sure you run `npm install` in the directory containing `package.json`

## Configuration
All configuration options should be set in a file called `config.json`, you can see an example in `config.template.json`.

**WARNING**: Configuration options only reload when the bot is restarted

For moderator flags see [discord.js docs](https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS)

### Defaults
| Config option | value | Comments |
| ------------- | ----- | -------- |
| moderator_flag | `MANAGE_MESSAGES` | |
| prefix | `!` | Prefix before `spambot`|
| rule_time | `24` | |
| rule_user_time | `24` | |
| rule_file | `./rules.json` | |
| auto_rule_rate | `60000` | Time limit between each user with the same joining for auto rules |
| auto_rule_count | `4` | Number of users that must match an auto rule before it is enforced |


## Running
To run using node use `node ./index.js`

This command is what is run by the `start.sh` and `start.bat` scripts but you can use these if you prefer.

## Usage

### Commands
| Command | Description | Example |
| ------- | ----------- | ------- |
| `!spamban new [-time TIME] [-length LENGTH] {RULE}` | Create a new ban rule. `TIME` - optional number specifying how new the users account can be (hours). `LENGTH` - optional number specifying how long a rule should be active (hours). `RULE` - required regex rule matched against the name | `!spamban new Spambots!` or `!spamban -time 72 -length 48 ^bot$` |
| `!spamban help [COMMAND]...` | Get help with a command | `!spamban help search` |
| `!spamban list` | List all active rules | `!spamban list` |
| `!spamban delete {RULEID}` | Delete a rule where the `RULEID` is the `#number` outputted by the list command | `!spamban delete #1576615175279` |
| `!spamban search {TERM}...` | Search all rules that haven't been deleted | `!spamban search #1576617418461` or `!spamban search @Tom` or `!spamban search #1576617418461 @Tom @Dave #1576615175279` |
