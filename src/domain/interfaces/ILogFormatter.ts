import { LogEntry } from '../entities/LogEntry';

export interface ILogFormatter {
  format(entry: LogEntry): string;
  getName(): string;
}