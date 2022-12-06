import { DefineCommand, Option, Command } from 'artus-common-bin';

export interface TestOption {
  baseDir: string;
  file: string[]
}

@DefineCommand({
  command: 'test <baseDir> [file...]',
  description: 'Run the unitest',
  alias: [ 't' ],
})
export class TestCommand extends Command {
  @Option()
  options: TestOption;

  async run() {
    console.info('test baseDir', this.options.baseDir);
    console.info('test files', this.options.file);
  }
}
