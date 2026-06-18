// Provides types for static image imports (e.g. `import img from
// "@/images/foo.jpg"`) during `tsc --noEmit`. Next.js normally supplies these
// via the auto-generated next-env.d.ts, but that file is git-ignored and isn't
// present in CI before `next build` runs, so we reference the same declarations
// here. (TypeScript loads the referenced lib once, so this won't conflict with
// next-env.d.ts locally.)
/// <reference types="next/image-types/global" />
