const tag: string = Bun.env.GREETING_TAG ?? "";

function say(): void {
  console.log(`hello world oxzoo-worker-bun_${tag}`);
}

if (tag === "") {
  console.error(
    "GREETING_TAG is not set or empty; refusing to start. Set it in the ox Environment editor, or pass GREETING_TAG=<tag> locally.",
  );
  process.exit(1);
}

say();
setInterval(say, 10_000);
