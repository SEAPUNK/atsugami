import { Button } from "@/ui/button";
import PostView from "./PostView";
import Search from "./Search";
import SearchResults from "./SearchResults";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@/ui/dialog";

export default function Browse() {
  return (
    <div className="relative w-screen h-screen flex flex-row">
      <div className="flex flex-col flex-grow-0 flex-shrink-0 w-[300px] h-full border-r border-stone-200">
        <div className="p-2 flex-grow-0 flex-shrink-0 border-b border-stone-200">
          <Search />
        </div>
        <SearchResults />
        <div className="p-2 border-stone-200 border-t h-14 flex justify-start items-center gap-2">
          <img src="/atsugamiLogo.png" className="h-full" alt="Atsugami logo" />
          <div className="text-lg">Atsugami</div>
          <div className="flex-grow" />
          <Dialog>
            <DialogTrigger>
              <Button className="rounded-full w-10 text-lg" variant="outline">
                ?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogDescription>
                  <div className="text-stone-900 flex items-start justify-center flex-col gap-4">
                    <img
                      src="/atsugami.png"
                      className="h-16"
                      alt="Atsugami logo"
                    />
                    <p>Atsugami is a booru viewer.</p>
                    <p>
                      If you're familiar with boorus, then you're already
                      familiar with Atsugami: Just type in the tags to search.
                    </p>
                    <p>
                      {/* TODO: we should get rid of this line when we actually have adapters as plugins */}
                      This Atsugami instance is connected to{" "}
                      <a href="https://safebooru.org" target="_blank">
                        Safebooru
                      </a>
                      , which <em>tries</em> to provide only SFW anime-style
                      images. Your mileage may vary.
                    </p>
                    <p>
                      <Button asChild variant="outline">
                        <a href="https://github.com/SEAPUNK/atsugami">
                          GitHub Repo
                        </a>
                      </Button>
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex-grow-0 flex-shrink-0 w-[calc(100vw-300px)] h-full">
        <PostView />
      </div>
    </div>
  );
}
