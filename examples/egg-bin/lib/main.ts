import { DefineCommand, Command } from 'artus-common-bin';

@DefineCommand({
  command: '$0',
})
export class MainCommand extends Command {
  async run() {
    console.info('main');
  }
}
