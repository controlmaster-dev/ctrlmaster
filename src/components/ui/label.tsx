import * as React from "react";
import { cn } from "@/lib/utils";import { jsx as _jsx } from "react/jsx-runtime";



const Label = React.forwardRef(
  ({ className, ...props  }: any, ref: any) =>
  _jsx("label", {
    ref: ref,
    className: cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    ), ...
    props }
  )

);
Label.displayName = "Label";

export { Label };