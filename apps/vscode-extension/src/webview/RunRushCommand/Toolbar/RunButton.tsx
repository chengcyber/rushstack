import { PrimaryButton } from '@fluentui/react/lib/Button';

export const RunButton = (): JSX.Element => {
  return (
    <PrimaryButton text="Primary" onClick={_alertClicked} allowDisabledFocus />
  )
}
function _alertClicked(): void {
  alert('Clicked');
}