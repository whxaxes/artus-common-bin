import { DefineCommand, DefineOption, Command } from 'artus-common-bin';

@DefineCommand({
  command: 'simple-bin [baseDir]',
})
export class MainCommand extends Command {
  @DefineOption({
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
