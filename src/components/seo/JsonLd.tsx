import { siteUrl } from "@/lib/site";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\u003c"),
      }}
    />
  );
}

export function Breadcrumbs({ items }: { items: [name: string, path: string][] }) {
  return <JsonLd data={{
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: siteUrl(path),
    })),
  }} />;
}

export function FaqJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  return <JsonLd data={{
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  }} />;
}
