import { INavStyles, INavLinkGroup, Nav, INavLink } from "@fluentui/react";

const navStyles: Partial<INavStyles> = {
  root: {
    width: '100%',
    height: 'auto',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
};

const navLinkGroups: INavLinkGroup[] = [
  {
    links: [
      {
        name: 'Home',
        url: 'http://example.com',
        expandAriaLabel: 'Expand Home section',
        collapseAriaLabel: 'Collapse Home section',
        links: [
          {
            name: 'Activity',
            url: 'http://msn.com',
            key: 'key1',
            target: '_blank',
          },
          {
            name: 'MSN',
            url: 'http://msn.com',
            disabled: true,
            key: 'key2',
            target: '_blank',
          },
        ],
        isExpanded: true,
      },
      {
        name: 'Documents',
        url: 'http://example.com',
        key: 'key3',
        isExpanded: true,
        target: '_blank',
      },
      {
        name: 'Pages',
        url: 'http://msn.com',
        key: 'key4',
        target: '_blank',
      },
      {
        name: 'Notebook',
        url: 'http://msn.com',
        key: 'key5',
        disabled: true,
      },
      {
        name: 'Communication and Media',
        url: 'http://msn.com',
        key: 'key6',
        target: '_blank',
      },
      {
        name: 'News',
        url: 'http://cnn.com',
        icon: 'News',
        key: 'key7',
        target: '_blank',
      },
    ],
  },
];
export const ParameterNav = (): JSX.Element => {
  return (
    <Nav
      onLinkClick={_onLinkClick}
      selectedKey="key3"
      ariaLabel="Nav basic example"
      styles={navStyles}
      groups={navLinkGroups}
    />
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function _onLinkClick(ev?: React.MouseEvent<HTMLElement>, item?: INavLink) {
  if (item && item.name === 'News') {
    alert('News link clicked');
  }
}
