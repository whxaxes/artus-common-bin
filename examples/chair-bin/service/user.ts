import { Injectable, ScopeEnum } from 'artus-common-bin';
import inquirer from 'inquirer';

@Injectable({
  scope: ScopeEnum.EXECUTION,
})
export class UserService {
  async getUserInfo() {
    const result = await inquirer.prompt([{
      name: 'user',
      message: 'please input your name',
    }]);

    return result.user;
  }
}
