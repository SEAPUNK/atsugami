// useDebouncedHide stores a boolean that
// - setting of it contributes to the debounce delay
// - when set to true happens immediately
// - when set to false, happens after the debounce delay
import { useCallback, useRef, useState } from "react";
import { debounce } from "lodash-es";

// as a way to reveal or hide controls after
export function useDebouncedHide(
  initialState: boolean,
  debounceDelay: number,
): [boolean, () => void, () => void] {
  let [shouldShow, setShouldShow] = useState(initialState);

  let debouncer = useRef(debounce(setShouldShow, debounceDelay));

  let reveal = useCallback(() => {
    if (shouldShow) return;
    setShouldShow(true);
    // noop to trigger debouncer
    debouncer.current((shouldShow) => shouldShow);
  }, [shouldShow]);

  let hide = useCallback(() => {
    if (!shouldShow) return;
    debouncer.current(false);
  }, [shouldShow]);

  return [shouldShow, reveal, hide];
}
