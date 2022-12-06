import { Command } from './proto/Command';

export interface CommandProps {
  command?: string;
  description?: string;
  alias?: string | string[];
  parent?: typeof Command;
}

export interface OptionProps {
  type?: string;
  alias?: string | string[];
  default?: any;
  description?: string;
}

export interface OptionMeta<T extends string = string> {
  key: string;
  meta: Record<T, OptionProps>;
}

export interface CommandMeta extends CommandProps {
  // nothing
}