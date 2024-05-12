// helper to get the nearest aspect ratio for a given resolution
// provides additional information such as which devices this resolution it's commonly seen on
type AspectRatio = {
  w: number;
  h: number;
  // short description of aspect ratio, such as common resolutions for it,
  // and what devices this could fit
  desc: string;
};

let mkRatio = (w: number, h: number, desc: string) => ({ w, h, desc });

let COMMON_ASPECT_RATIOS: AspectRatio[] = [
  mkRatio(1, 1, `Square`),
  mkRatio(5, 4, `Commonly seen in older displays`),
  mkRatio(4, 3, `Seen in some tablets`),
  mkRatio(3, 2, `Seen in some Microsoft Surface devices`),
  mkRatio(16, 10, `Resolutions include 1920x1200, 2560x1600, 3840x2400`),
  mkRatio(16, 9, `1080p, 1440p, 4k`),
  mkRatio(256, 135, `DCI 4K`),
  mkRatio(21, 9, `For ultrawide displays`),
  mkRatio(32, 9, `For ultrawide(r) displays`),
];

export default function findNearestAspectRatio(
  {
    width,
    height,
  }: {
    width: number;
    height: number;
  },
  errorThreshold: number = 0.05,
) {
  let imageRatio = width / height;
  let lastOffBy = Infinity;
  let selectedRatio: AspectRatio | null = null;
  for (let commonRatio of COMMON_ASPECT_RATIOS) {
    let targetRatio = commonRatio.w / commonRatio.h;
    let offBy = Math.abs(targetRatio - imageRatio);
    if (offBy < lastOffBy) {
      selectedRatio = commonRatio;
      lastOffBy = offBy;
    }

    // also get the inverse for flipped aspect ratios
    let inverseRatio: AspectRatio = {
      ...commonRatio,
      h: commonRatio.w,
      w: commonRatio.h,
    };
    let inverseTargetRatio = commonRatio.w / commonRatio.h;
    let inverseOffBy = Math.abs(inverseTargetRatio - imageRatio);
    if (inverseOffBy < lastOffBy) {
      selectedRatio = inverseRatio;
      lastOffBy = offBy;
    }
  }

  if (lastOffBy <= errorThreshold) {
    return { nearestRatio: selectedRatio, offBy: lastOffBy };
  } else {
    return { nearestRatio: null, offBy: lastOffBy };
  }
}
