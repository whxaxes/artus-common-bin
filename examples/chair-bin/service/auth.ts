import { Injectable, ScopeEnum } from 'artus-common-bin';
import inquirer from 'inquirer';

@Injectable({
  scope: ScopeEnum.EXECUTION,
})
export class AuthService {
  async auth() {
    const result = await inquirer.prompt([{
      name: 'password',
      message: 'please input your password',
    }]);

    return result.password;
  }
}
