"use client";

import type { NextPage } from "next";
import "~~/styles/globals.css";

const DemoLayout: NextPage<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
};

export default DemoLayout;
