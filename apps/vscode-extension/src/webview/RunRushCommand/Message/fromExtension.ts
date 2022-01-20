import { store } from '../store';
import { initializeParameters } from '../store/slices/parameter';

import type { CommandLineParameter } from '@rushstack/ts-command-line';

export type IFromExtensionMessage = IFromExtensionMessageInitialize;

interface IFromExtensionMessageInitialize {
  command: 'initialize';
  parameters: CommandLineParameter[];
}

export const fromExtensionListener: (event: MessageEvent<IFromExtensionMessage>) => void = (
  event: MessageEvent<IFromExtensionMessage>
) => {
  const message: IFromExtensionMessage = event.data;
  switch (message.command) {
    case 'initialize': {
      store.dispatch(
        initializeParameters({
          parameters: message.parameters
        })
      );
      break;
    }
    default: {
      const _command: never = message.command;
      throw new Error(`Unknown command: ${_command}`);
    }
  }
};
