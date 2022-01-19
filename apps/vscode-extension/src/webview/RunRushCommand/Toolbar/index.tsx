import { DefaultPalette, IStackItemStyles, IStackStyles, IStackTokens, Stack } from "@fluentui/react"
import { RunButton } from "./RunButton";
import { SearchBar } from "./SearchBar";

// Styles definition
const stackStyles: IStackStyles = {
  root: {
    background: DefaultPalette.themeTertiary,
  },
};

const stackItemStyles: IStackItemStyles = {
  root: {
    background: DefaultPalette.themePrimary,
    color: DefaultPalette.white,
    padding: 5,
  },
};

const horizontalGapStackTokens: IStackTokens = {
  childrenGap: 10,
  padding: 10,
};

export const Toolbar = (): JSX.Element => {
  return (
    <Stack horizontal disableShrink styles={stackStyles} tokens={horizontalGapStackTokens}>
      <Stack.Item align="center" grow styles={stackItemStyles}>
        <SearchBar />
      </Stack.Item>
      <Stack.Item align="center" styles={stackItemStyles}>
        <RunButton />
      </Stack.Item>
    </Stack>
  )
}
