"use client";

import { BlinkProviders } from "../../components/BlinkProviders";

export default function MemeTinderLayout({ children }: { children: React.ReactNode }) {
  return <BlinkProviders>{children}</BlinkProviders>;
}
