import PostView from "./PostView";
import Search from "./Search";
import SearchResults from "./SearchResults";

export default function Browse() {
  return (
    <div className="relative w-screen h-screen flex flex-row">
      <div className="flex flex-col flex-grow-0 flex-shrink-0 w-[300px] h-full border-r border-stone-200">
        <div className="p-2 flex-grow-0 flex-shrink-0 border-b border-stone-200">
          <Search />
        </div>
        <SearchResults />
      </div>
      <div className="flex-grow-0 flex-shrink-0 w-[calc(100vw-300px)] h-full">
        <PostView />
      </div>
    </div>
  );
}
