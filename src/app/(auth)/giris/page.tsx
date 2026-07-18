import { Suspense } from "react";
import { AuthMixfont } from "../AuthMixfont";

export default function GirisPage() {
  return (
    <Suspense>
      <AuthMixfont mode="sign-in" />
    </Suspense>
  );
}
