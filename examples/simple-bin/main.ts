import { DefineCommand, Option, Command } from 'artus-common-bin';

@DefineCommand({
  usage: 'simple-bin [baseDir]',
})
export class MainCommand extends Command {
  @Option({
    flags: {
      type: 'number',
      default: 0,
      description: 'Just A Flag',
    },
  })
  options: any;

  async run() {
    console.info('flags', this.options.flags);
  }
}
