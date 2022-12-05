import { DefineCommand, Command } from 'artus-common-bin';

@DefineCommand({
  usage: 'my-bin',
})
export class MainCommand extends Command {
  async run() {
    console.info('main');
  }
}
