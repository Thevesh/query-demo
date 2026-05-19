import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  override: {
    classGroups: {
      "font-size": [
        {
          text: [
            (cls: string) => cls.startsWith("heading-"),
            (cls: string) => cls.startsWith("body-"),
          ],
        },
      ],
    },
  },
});

export const clx = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
