import { Suspense } from "react";
import InteractionClient from "./InteractionClient";

export async function generateStaticParams() {
  return [
    { pool: "pool" }
  ];
}

export default function PoolPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          <InteractionClient />
        </Suspense>
      </main>
    </div>
  );
}
