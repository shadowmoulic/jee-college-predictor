import { cutoffMetadata, renderCutoffGuide } from "@/components/seo/CutoffGuidePage";

type Props = { params: Promise<{ group: string; program: string }> };

export function generateStaticParams() {
  return [];
}

export function generateMetadata(props: Props) {
  return cutoffMetadata(props, 2026);
}

export default function Page(props: Props) {
  return renderCutoffGuide(props, 2026);
}
