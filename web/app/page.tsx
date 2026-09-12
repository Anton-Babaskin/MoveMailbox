import { Hero } from '@/components/sections/hero';
import { Workspace } from '@/components/sections/workspace';
import { TrustRow } from '@/components/sections/trust-row';
import { Security } from '@/components/sections/security';
import { Brief } from '@/components/sections/brief';
import { Modes } from '@/components/sections/modes';
import { FaqShort } from '@/components/sections/faq-short';
import { FinalCta } from '@/components/sections/final-cta';

export default function Page() {
  return (
    <main>
      <Hero />
      <Workspace />
      <TrustRow />
      <Security />
      <Brief />
      <Modes />
      <FaqShort />
      <FinalCta />
    </main>
  );
}
