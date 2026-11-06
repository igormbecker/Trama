import { list, del } from "@vercel/blob";

// A dry run is the default. Copy the environment's credentials into the
// process environment, never into this file or a command shared in chat.
const args = process.argv.slice(2);
const environment = args
  .find((value) => value.startsWith("--environment="))
  ?.split("=")[1];
const days = Number(
  args.find((value) => value.startsWith("--days="))?.split("=")[1],
);
if (
  !["preview", "production", "development"].includes(environment) ||
  !Number.isInteger(days) ||
  days < 1
) {
  throw new Error(
    "Use --environment=preview|production|development --days=<positive integer> [--delete]",
  );
}
const cutoff = Date.now() - days * 86400000;
const candidates = [];
let cursor;
do {
  const page = await list({ prefix: `narration/${environment}/`, cursor });
  candidates.push(
    ...page.blobs.filter(
      (blob) => new Date(blob.uploadedAt).getTime() < cutoff,
    ),
  );
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);
const bytes = candidates.reduce((sum, blob) => sum + blob.size, 0);
console.log(
  JSON.stringify({
    environment,
    days,
    files: candidates.length,
    bytes,
    deleting: args.includes("--delete"),
  }),
);
if (args.includes("--delete")) {
  for (const blob of candidates) {
    await del(blob.url);
  }
} else {
  for (const blob of candidates) {
    console.log(
      JSON.stringify({
        pathname: blob.pathname,
        bytes: blob.size,
        uploadedAt: blob.uploadedAt,
      }),
    );
  }
}
