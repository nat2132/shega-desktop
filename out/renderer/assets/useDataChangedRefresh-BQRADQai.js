import { r as reactExports } from "./index-CqMtuUke.js";
function useDataChangedRefresh(loadData) {
  const ref = reactExports.useRef(loadData);
  ref.current = loadData;
  reactExports.useEffect(() => {
    window.api.onDataChanged(() => {
      try {
        ref.current();
      } catch {
      }
    });
    return () => {
      window.api.removeDataChangedListeners();
    };
  }, []);
}
export {
  useDataChangedRefresh as u
};
