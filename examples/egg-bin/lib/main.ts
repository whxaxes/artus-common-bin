import { DefineCommand, Command } from 'artus-common-bin';

@DefineCommand()
export class MainCommand extends Command {
  async run() {
    console.info('main');
  }
}
