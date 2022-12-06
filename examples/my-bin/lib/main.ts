import { DefineCommand, Command } from 'artus-common-bin';

@DefineCommand({
  usage: '$0',
})
export class MainCommand extends Command {
  async run() {
    console.info('main');
  }
}
