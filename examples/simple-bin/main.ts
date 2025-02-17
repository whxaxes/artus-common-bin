// index.ts
import { DefineCommand, DefineOption, Command } from 'artus-common-bin';

interface Option {
  port: number;
  baseDir: string;
}

@DefineCommand({
  command: 'simple-bin [baseDir]',
  description: 'My Simple Bin',
})
export class MyCommand extends Command {
  @DefineOption<Option>({
    port: {
      type: 'number',
      alias: 'p',
      default: 3000,
      description: 'port',
    },
  })
  option: Option;

  async run() {
    console.info('Run with port %s in %s', this.option.port, this.option.baseDir);
  }
}
