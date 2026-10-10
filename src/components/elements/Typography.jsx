import { cn } from "@/lib/utils";

const variants = {
  h1: "scroll-m-20 text-4xl font-extrabold tracking-tight text-balance",
  h2: "scroll-m-20 text-3xl font-semibold tracking-tight",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
  p: "leading-7",
  lead: "text-xl text-muted-foreground",
  large: "text-lg font-semibold",
  small: "text-sm leading-none font-medium",
  muted: "text-sm text-muted-foreground",
  blockquote: "mt-6 border-l-2 pl-6 italic",
  list: "my-6 ml-6 list-disc [&>li]:mt-2",
  code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
};

const elements = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  p: "p",
  lead: "p",
  large: "div",
  small: "small",
  muted: "p",
  blockquote: "blockquote",
  list: "ul",
  code: "code",
};

export function Typography({ as = "p", children, className, ...props }) {
  const Component = elements[as] || "p";

  return (
    <Component className={cn(variants[as], className)} {...props}>
      {children}
    </Component>
  );
}

// example usage:
// <Typography as="h1">Hello World</Typography>
