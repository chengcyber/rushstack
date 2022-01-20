import { IStackStyles, DefaultPalette, Stack } from "@fluentui/react";
import { useAppSelector } from "../store/hooks";

const stackStyles: IStackStyles = {
  root: {
    background: DefaultPalette.themeTertiary,
  },
};

export const ParameterDisplay = (): JSX.Element => {
  const args: (string | [string, string])[] = useAppSelector(state => state.parameter.args);
  return (
    <Stack styles={stackStyles}>
      {
        args.map((arg: string | [string, string]) => {
          let text: string = '';
          if (Array.isArray(arg)) {
            text = `${arg[0]} ${arg[1]}`
          } else {
            text = arg
          }
          return <span key={text}>{text}</span>
        })
      }
    </Stack>
  )
}