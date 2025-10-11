declare module '*.gif' {
  const src: import('next/dist/shared/lib/get-img-props').StaticImport
  export default src
}

declare module '*.GIF' {
  const src: import('next/dist/shared/lib/get-img-props').StaticImport
  export default src
}
