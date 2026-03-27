"use client";;
import * as React from "react";
import { cn } from "@/lib/utils";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const radius = 100; // change this to increase the rdaius of the hover effect
  const [visible, setVisible] = React.useState(false);

  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY
  }) {
    let { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  return (
    <motion.div
      style={{
        background: useMotionTemplate`
      radial-gradient(
        ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
        oklch(0.72 0.1 262),
        transparent 72%
      )
    `,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="group/input rounded-xl p-[2px] transition duration-300">
      <input
        type={type}
        className={cn(
          `flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-[var(--shadow-sm)] transition duration-200 placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50`,
          className
        )}
        ref={ref}
        {...props} />
    </motion.div>
  );
});
Input.displayName = "Input";

export { Input };
