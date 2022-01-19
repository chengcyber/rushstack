import { SearchBox } from "@fluentui/react";


export const SearchBar = (): JSX.Element => {
  return (
    <SearchBox placeholder="Search Parameter" onSearch={newValue => console.log('value is ' + newValue)} />
  )
}