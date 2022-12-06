import { DefineCommand, Command } from 'artus-common-bin';

@DefineCommand({
  command: 'codegen',
  description: 'codegen plugin',
  alias: 'cg',
})
export class CodegenCommand extends Command {
  async run() {
    console.info('run codegen in codegen plugin');
  }
}
