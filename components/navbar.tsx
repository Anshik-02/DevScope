import Link from "next/link";
import { Button } from "./ui/button";
import { Network } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center font-bold justify-center rounded-lg bg-primary/20 text-xl ">
            D
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            DevScope
          </span>
        </div>

        <ul className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <li>
            <Link href="#features" className="transition-colors hover:text-foreground">
              Features
            </Link>
          </li>
          <li>
            <Link href="/docs" className="transition-colors hover:text-foreground">
              Docs
            </Link>
          </li>
          <li>
            <Link href="https://github.com/Anshik-02/DevScope" className="transition-colors hover:text-foreground">
              GitHub
            </Link>
          </li>

        </ul>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" className="hidden text-sm font-medium sm:inline-flex">
            Sign In
          </Button>
 
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
