import { Inject, DefineCommand, DefineOption, Command } from 'artus-common-bin';
import { UserService } from '../service/user';

export interface UserOption {
  user: string;
}

@DefineCommand({
  command: 'user',
  description: 'Show User Info',
})
export class ChairUserCommand extends Command {
  @DefineOption<UserOption>({
    user: {
      type: 'string',
      alias: 'u',
    },
  })
  options: UserOption;

  @Inject()
  userService: UserService;

  async run() {
    let user: string = this.options.user;

    if (!user) {
      user = await this.userService.getUserInfo();
    }

    console.info('user is', user);
  }
}
