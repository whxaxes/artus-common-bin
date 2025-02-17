import { Inject, DefineCommand, DefineOption, Command, CommandContext, Middleware } from 'artus-common-bin';
import { UserService } from '../service/user';
import { AuthService } from '../service/auth';

export interface UserOption {
  authCode: string;
}

async function authMiddleware(ctx: CommandContext, next) {
  const authService = ctx.container.get(AuthService);
  const authCode = '123';
  if (ctx.args.authCode !== authCode) {
    const inputCode = await authService.auth();
    if (inputCode !== authCode) {
      console.error('Error: invalid user!');
      process.exit(1);
    }
  }

  await next();
}

@DefineCommand({
  command: 'user',
  description: 'Show User Info',
})
@Middleware(authMiddleware)
export class ChairUserCommand extends Command {
  @DefineOption<UserOption>({
    authCode: {
      type: 'string',
      alias: 'u',
    },
  })
  options: UserOption;

  @Inject()
  userService: UserService;

  async run() {
    const user = await this.userService.getUserInfo();
    console.info('user is', user.nickname);
  }
}
