# memo
cli-based life tracking utility

## Installation

You've gotta have `node` installed, if you don't you probably shouldn't bother because node is horrible and your life is better off without it. Assuming you do have `node` installed you can run this with `node main.mjs` following an `npm install`. I recommend adding it to your startup config kinda like this 
```bash
alias memo="pushd ~/random_junk/memo/ > /dev/null && node main.mjs && popd > /dev/null"
```

## Usage

Keeps track of your life, at the prompt you can enter a time-period followed by a space and a description. It'll append it to a file and so far that's pretty much it.

All data is saved into a filed called `log` in a `\n` separated format where the first line is a UNIX timestamp indicating the start of the log and each line following is parsed as follows:
```
[TIME]{first space}[DESCRIPTION]{first pipe(|)}[TAGS (comma separated)]
```
additionally any description matching `/sleep/` will have all it's tags cobbered and will be tagged with `sleep` instead.

