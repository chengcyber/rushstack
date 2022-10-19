import React, { useCallback } from 'react';
import styles from './styles.scss';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addBookmark, removeBookmark, selectCurrentEntry } from '../../store/slices/entrySlice';

export const SelectedEntryPreview = (): JSX.Element => {
  const selectedEntry = useAppSelector(selectCurrentEntry);
  const isBookmarked = useAppSelector((state) =>
    selectedEntry ? state.entry.bookmarkedEntries.includes(selectedEntry) : false
  );
  const useDispatch = useAppDispatch();

  const bookmark = useCallback(() => {
    if (selectedEntry) useDispatch(addBookmark(selectedEntry));
  }, [selectedEntry]);
  const deleteEntry = useCallback(() => {
    if (selectedEntry) useDispatch(removeBookmark(selectedEntry));
  }, [selectedEntry]);

  if (!selectedEntry) {
    return (
      <div className={styles.selectedEntryCard}>
        <h5>No Entry Selected</h5>
      </div>
    );
  }

  return (
    <div className={styles.selectedEntryCard}>
      <div className={styles.selectedEntryHeader}>
        <h5>Selected entry:</h5>
        <span>{selectedEntry.displayText}</span>
      </div>

      <p>Package JSON path: {selectedEntry.packageJsonFolderPath}</p>

      {isBookmarked ? (
        <button onClick={deleteEntry}>Remove Bookmark</button>
      ) : (
        <button onClick={bookmark}>Add Bookmark</button>
      )}
    </div>
  );
};
