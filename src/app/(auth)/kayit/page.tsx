import { Suspense } from "react";
import { AuthMixfont } from "../AuthMixfont";

export default function KayitPage() {
  return (
    <Suspense>
      <AuthMixfont mode="sign-up" />
    </Suspense>
  );
}
