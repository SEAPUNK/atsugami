import { useAppSelector } from "@/store.hooks";

export default function PostInfoPanel() {
  let showInfoPanel = useAppSelector((state) => state.app.showInfoPanel);

  if (!showInfoPanel) return null;

  return (
    <div className="pointer-events-auto bg-orange-500">
      post info panel goes here
    </div>
  );
}
