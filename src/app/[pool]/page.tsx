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
        <InteractionClient />
      </main>
    </div>
  );
}
