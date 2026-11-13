import { Brand } from "@/components/Brand";
import { TextSizeToggle } from "@/components/TextSizeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-width header-content">
        <Brand />
        <TextSizeToggle />
      </div>
    </header>
  );
}
