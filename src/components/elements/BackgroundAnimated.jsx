import { cn } from "@/lib/utils";
import { AnimatedGridPattern } from "../ui/animated-grid-pattern";

export const BackgroundAnimatedGridPattern = () => {
  return (
    <AnimatedGridPattern
      numSquares={30}
      maxOpacity={0.2}
      duration={3}
      repeatDelay={1}
      className={cn(
        "inset-x-0 inset-y-[-70%] h-[200%] skew-y-12 md:inset-y-[-70%]",
        "opacity-40 mask-[radial-gradient(600px_circle_at_center,#007595,transparent)]",
      )}
    />
  );
};
