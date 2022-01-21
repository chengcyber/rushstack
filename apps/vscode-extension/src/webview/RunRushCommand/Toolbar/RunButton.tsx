import { PrimaryButton } from '@fluentui/react/lib/Button';
import { useCallback } from 'react';
import { sendMessageToExtension } from '../Message/toExtension';

import { useAppSelector } from '../store/hooks';
import { useParameterArgs } from '../store/slices/parameter';

export const RunButton = (): JSX.Element => {
  const commandName: string = useAppSelector((state) => state.parameter.commandName);
  const args: string[] = useParameterArgs();
  const onClickRunButton: () => void = useCallback(() => {
    if (!commandName) {
      return;
    }
    sendMessageToExtension({
      command: 'commandInfo',
      commandName,
      args
    });
  }, [args, commandName]);
  return <PrimaryButton text="RUN" onClick={onClickRunButton} allowDisabledFocus />;
};
