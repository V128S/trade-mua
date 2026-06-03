import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";

// Server-rendered markdown → styled HTML (so article text ships in the static
// HTML for SEO). Internal links (starting with "/") go through the next-intl
// Link so they keep the active locale prefix; external links open in a new tab.
export default function PostBody({ children }: { children: string }) {
  return (
    <div className="max-w-3xl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: (p) => <h2 className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest mt-12 mb-4 scroll-mt-24" {...p} />,
          h3: (p) => <h3 className="font-technical-data text-technical-data text-on-surface text-lg mt-8 mb-3" {...p} />,
          p: (p) => <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-5" {...p} />,
          ul: (p) => <ul className="list-disc pl-6 mb-5 space-y-2 font-body-lg text-body-lg text-on-surface-variant" {...p} />,
          ol: (p) => <ol className="list-decimal pl-6 mb-5 space-y-2 font-body-lg text-body-lg text-on-surface-variant" {...p} />,
          li: (p) => <li className="leading-relaxed" {...p} />,
          strong: (p) => <strong className="text-on-surface font-semibold" {...p} />,
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <Link href={href} className="text-primary hover:underline underline-offset-2">{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-2">{children}</a>
            ),
          blockquote: (p) => <blockquote className="border-l-2 border-primary pl-4 my-6 italic text-on-surface-variant" {...p} />,
          table: (p) => <div className="overflow-x-auto mb-6"><table className="w-full text-sm border-collapse" {...p} /></div>,
          th: (p) => <th className="border-card border px-3 py-2 text-left font-technical-data text-on-surface text-xs uppercase tracking-wider" {...p} />,
          td: (p) => <td className="border-card border px-3 py-2 text-on-surface-variant" {...p} />,
          hr: () => <hr className="border-card my-10" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
