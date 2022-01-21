import { IStackStyles, DefaultPalette, Stack, IStackItemStyles } from '@fluentui/react';
import { useMemo } from 'react';
import { useParameterArgs } from '../store/slices/parameter';

const stackStyles: IStackStyles = {
  root: {
    minWidth: 0,
    background: DefaultPalette.themeTertiary
  }
};

const stackItemStyles: IStackItemStyles = {
  root: {
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
};

export const ParameterDisplay = (): JSX.Element => {
  const args: string[] = useParameterArgs();
  const argsTextList: string[] = useMemo(() => {
    const ret: string[] = [];
    for (let i: number = 0; i < args.length; i++) {
      const currentArg: string = args[i];
      let nextArg: string | undefined;
      if (i + 1 < args.length) {
        nextArg = args[i + 1];
      }
      if (!nextArg || nextArg?.startsWith('--')) {
        ret.push(currentArg);
      } else {
        ret.push(`${currentArg} ${nextArg}`);
        i++;
      }
    }
    return ret;
  }, [args]);
  return (
    <Stack styles={stackStyles}>
      {argsTextList.map((text: string) => {
        return (
          <Stack.Item styles={stackItemStyles} key={text}>
            <span title={text} style={{ whiteSpace: 'nowrap' }}>
              {text}
            </span>
          </Stack.Item>
        );
      })}
    </Stack>
  );
};
