import React, { useCallback } from 'react';
import appStyles from '../../appstyles.scss';
import styles from './styles.scss';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { LockfileEntry } from '../../parsing/LockfileEntry';
import { clearStackAndPush, removeBookmark } from '../../store/slices/entrySlice';

export const BookmarksSidebar = (): JSX.Element => {
  const bookmarks = useAppSelector((state) => state.entry.bookmarkedEntries);
  const dispatch = useAppDispatch();

  const clear = useCallback(
    (entry: LockfileEntry) => () => {
      dispatch(clearStackAndPush(entry));
    },
    []
  );
  const deleteEntry = useCallback(
    (entry: LockfileEntry) => () => {
      dispatch(removeBookmark(entry));
    },
    []
  );

  return (
    <div className={`${appStyles.containerCard} ${styles.BookmarksWrapper}`}>
      <h5>Bookmarks</h5>
      <hr />
      {bookmarks.map((bookmarkedEntry) => (
        <div key={bookmarkedEntry.rawEntryId} className={styles.BookmarkEntry}>
          <p onClick={clear(bookmarkedEntry)}>{bookmarkedEntry.displayText}</p>
          <button onClick={deleteEntry(bookmarkedEntry)}>Remove</button>
        </div>
      ))}
    </div>
  );
};
