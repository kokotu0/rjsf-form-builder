/**
 * 시험장 개발 서버. src 를 바로 읽고, 고치면 페이지를 다시 그린다.
 *
 *   npm run playground          http://localhost:5180
 *   PORT=6000 npm run playground
 */
import * as esbuild from "esbuild"
import { fileURLToPath } from "node:url"

const here = fileURLToPath(new URL(".", import.meta.url))

const ctx = await esbuild.context({
  entryPoints: [`${here}main.tsx`],
  bundle: true,
  outdir: `${here}out`,
  format: "esm",
  jsx: "automatic",
  sourcemap: true,
  alias: { "@kokotu0/rjsf-form-builder": `${here}../src/index.ts` },
  define: { "process.env.NODE_ENV": '"development"' },
  logLevel: "info",
})

await ctx.watch()
const { port } = await ctx.serve({ servedir: here, port: Number(process.env.PORT ?? 5180) })
console.log(`playground: http://localhost:${port}`)
