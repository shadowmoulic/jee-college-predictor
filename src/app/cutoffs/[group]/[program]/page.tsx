import { cutoffMetadata, renderCutoffGuide } from "@/components/seo/CutoffGuidePage";

type Props = { params: Promise<{ group: string; program: string }> };

export function generateStaticParams() {
  return [];
}

export function generateMetadata(props: Props) {
  return cutoffMetadata(props);
}

export default function Page(props: Props) {
  return renderCutoffGuide(props);
}
