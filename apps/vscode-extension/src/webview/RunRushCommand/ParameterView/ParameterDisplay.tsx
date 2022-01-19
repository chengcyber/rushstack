import { IStackStyles, DefaultPalette, Stack } from "@fluentui/react";

const stackStyles: IStackStyles = {
  root: {
    background: DefaultPalette.themeTertiary,
  },
};

export const ParameterDisplay = (): JSX.Element => {
  return (
    <Stack styles={stackStyles}>
      <span>Item One</span>
      <span>Item Two</span>
      <span>Item Three</span>
    </Stack>
  )
}