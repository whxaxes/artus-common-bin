import { Injectable, ScopeEnum } from 'artus-common-bin';
import inquirer from 'inquirer';

@Injectable({
  scope: ScopeEnum.EXECUTION,
})
export class UserService {
  async getUserInfo() {
    return {
      nickname: 'foo',
    };
  }
}
